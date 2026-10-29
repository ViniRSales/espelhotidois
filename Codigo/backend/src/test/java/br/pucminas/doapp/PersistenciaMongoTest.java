package br.pucminas.doapp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Pattern;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mongodb.MongoDBContainer;

import br.pucminas.doapp.service.LimiteTentativas;
import br.pucminas.doapp.service.email.EnvioEmail;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * Confere, num MongoDB de verdade, o que cada fluxo grava no banco: passa pela API inteira (segurança, validação,
 * serviços) e lê as coleções direto, sem os repositórios. Precisa de Docker; sem ele, os testes são pulados.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class PersistenciaMongoTest {

    @Container
    @ServiceConnection
    static MongoDBContainer mongo = new MongoDBContainer("mongo:8");

    @TempDir
    static Path fotos;

    @DynamicPropertySource
    static void propriedades(DynamicPropertyRegistry registro) {
        registro.add("doapp.doacoes.fotos.diretorio", fotos::toString);
    }

    /** Os limites contra força bruta têm testes próprios; aqui atrapalhariam os vários cadastros seguidos. */
    @MockitoBean
    private LimiteTentativas limite;

    /** Sem servidor de e-mail: o teste lê o link que seria enviado. */
    @MockitoBean
    private EnvioEmail email;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private MongoTemplate banco;

    @Autowired
    private ObjectMapper json;

    @BeforeEach
    void limpar() {
        for (String colecao : List.of("usuarios", "tokens_revogados", "redefinicoes_senha", "doacoes")) {
            banco.getCollection(colecao).deleteMany(new Document());
        }
    }

    private JsonNode cadastrar(String emailConta) throws Exception {
        String corpo = """
                {"tipo": "INSTITUICAO", "nome": "  Bazar da Paróquia ", "email": "%s",
                 "telefone": "(31) 3333-4444", "bairro": "Savassi", "cidade": "Belo Horizonte", "uf": "mg",
                 "senha": "segredo123"}
                """.formatted(emailConta);
        String resposta = mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(resposta);
    }

    private String entrar(String emailConta, String senha) throws Exception {
        String corpo = """
                {"email": "%s", "senha": "%s"}""".formatted(emailConta, senha);
        String resposta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("token").asString();
    }

    private Document usuario(String emailConta) {
        return banco.getCollection("usuarios").find(new Document("email", emailConta)).first();
    }

    private boolean temIndice(String colecao, String campo, String opcao) {
        for (Document indice : banco.getCollection(colecao).listIndexes()) {
            Document chave = indice.get("key", Document.class);
            if (chave.containsKey(campo) && (opcao == null || indice.containsKey(opcao))) {
                return true;
            }
        }
        return false;
    }

    private static String sha256(String texto) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void cadastroGravaAContaNormalizadaESoOHashDaSenha() throws Exception {
        JsonNode sessao = cadastrar("Bazar@Email.COM");

        Document conta = usuario("bazar@email.com");
        assertThat(conta).isNotNull();
        assertThat(conta.getObjectId("_id").toHexString()).isEqualTo(sessao.at("/usuario/id").asString());
        assertThat(conta.getString("tipo")).isEqualTo("INSTITUICAO");
        assertThat(conta.getString("nome")).isEqualTo("Bazar da Paróquia");
        assertThat(conta.getString("telefone")).isEqualTo("3133334444");
        assertThat(conta.get("localizacao", Document.class))
                .containsEntry("bairro", "Savassi")
                .containsEntry("cidade", "Belo Horizonte")
                .containsEntry("uf", "MG");
        assertThat(conta.getDate("criadoEm")).isNotNull();
        // A senha nunca é guardada como texto: só o hash BCrypt.
        assertThat(conta.getString("senhaHash")).startsWith("$2").doesNotContain("segredo123");
        assertThat(conta.toJson()).doesNotContain("segredo123");
        // E o hash nunca volta para o front-end.
        assertThat(sessao.toString()).doesNotContain("senhaHash").doesNotContain("$2");
    }

    @Test
    void emailTemIndiceUnicoEOSegundoCadastroNaoGravaNada() throws Exception {
        cadastrar("maria@email.com");

        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content("""
                {"tipo": "PESSOA_FISICA", "nome": "Outra Maria", "email": "MARIA@email.com",
                 "telefone": "31999998888", "bairro": "Centro", "cidade": "Contagem", "uf": "MG", "senha": "outrasenha1"}
                """)).andExpect(status().isConflict());

        assertThat(temIndice("usuarios", "email", "unique")).isTrue();
        assertThat(banco.getCollection("usuarios").countDocuments()).isEqualTo(1);
        assertThat(usuario("maria@email.com").getString("nome")).isEqualTo("Bazar da Paróquia");
    }

    @Test
    void cadastroInvalidoNaoGravaNada() throws Exception {
        mvc.perform(post("/api/auth/cadastro").contentType(MediaType.APPLICATION_JSON).content("""
                {"tipo": "PESSOA_FISICA", "nome": "Maria", "email": "maria@email.com",
                 "telefone": "31999998888", "bairro": "Savassi", "cidade": "Belo Horizonte", "uf": "XX", "senha": "segredo123"}
                """)).andExpect(status().isBadRequest());

        assertThat(banco.getCollection("usuarios").countDocuments()).isZero();
    }

    @Test
    void logoutGravaOTokenRevogadoComPrazoParaOMongoApagar() throws Exception {
        cadastrar("maria@email.com");
        String token = entrar("maria@email.com", "segredo123");

        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        Document revogado = banco.getCollection("tokens_revogados").find().first();
        assertThat(revogado).isNotNull();
        assertThat(revogado.getString("_id")).isNotBlank();
        assertThat(revogado.getDate("expiraEm").toInstant()).isAfter(Instant.now());
        // O índice TTL faz o próprio MongoDB apagar o registro quando o token venceria.
        assertThat(temIndice("tokens_revogados", "expiraEm", "expireAfterSeconds")).isTrue();
        // E o token deixa de valer.
        mvc.perform(get("/api/auth/eu").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void recuperacaoGuardaSoOHashDoLinkETrocaASenhaUmaVezSo() throws Exception {
        cadastrar("maria@email.com");
        String tokenAntigo = entrar("maria@email.com", "segredo123");
        String hashAntigo = usuario("maria@email.com").getString("senhaHash");

        mvc.perform(post("/api/auth/esqueci-senha").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\": \"maria@email.com\"}")).andExpect(status().isNoContent());

        ArgumentCaptor<String> texto = ArgumentCaptor.forClass(String.class);
        verify(email).enviar(eq("maria@email.com"), anyString(), texto.capture(), anyString());
        var link = Pattern.compile("token=([A-Za-z0-9_-]+)").matcher(texto.getValue());
        assertThat(link.find()).isTrue();
        String tokenDoLink = link.group(1);

        Document pedido = banco.getCollection("redefinicoes_senha").find().first();
        assertThat(pedido).isNotNull();
        assertThat(pedido.getString("usuarioId")).isEqualTo(usuario("maria@email.com").getObjectId("_id").toHexString());
        // O banco guarda só o SHA-256 do token: quem lê o banco não consegue usar o link.
        assertThat(pedido.getString("tokenHash")).isEqualTo(sha256(tokenDoLink)).isNotEqualTo(tokenDoLink);
        assertThat(pedido.toJson()).doesNotContain(tokenDoLink);
        assertThat(temIndice("redefinicoes_senha", "expiraEm", "expireAfterSeconds")).isTrue();
        assertThat(temIndice("redefinicoes_senha", "tokenHash", "unique")).isTrue();

        String corpo = "{\"token\": \"%s\", \"senha\": \"senhaNova99\"}".formatted(tokenDoLink);
        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isNoContent());

        Document conta = usuario("maria@email.com");
        assertThat(conta.getString("senhaHash")).isNotEqualTo(hashAntigo).startsWith("$2");
        assertThat(conta.getInteger("versaoSessao")).isEqualTo(1);
        assertThat(conta.getDate("senhaAlteradaEm")).isNotNull();
        assertThat(banco.getCollection("redefinicoes_senha").countDocuments()).isZero();
        // O link não vale de novo, a sessão antiga caiu e só a senha nova entra.
        mvc.perform(post("/api/auth/redefinir-senha").contentType(MediaType.APPLICATION_JSON).content(corpo))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/auth/eu").header("Authorization", "Bearer " + tokenAntigo))
                .andExpect(status().isUnauthorized());
        entrar("maria@email.com", "senhaNova99");
    }

    @Test
    void rascunhoDeDoacaoFicaGravadoNoNomeDeQuemCriou() throws Exception {
        String donoId = cadastrar("maria@email.com").at("/usuario/id").asString();
        String token = entrar("maria@email.com", "segredo123");

        String criado = mvc.perform(post("/api/doacoes").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"titulo\": \"Cadeira de rodas\"}"))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        String id = json.readTree(criado).get("id").asString();

        mvc.perform(put("/api/doacoes/" + id).header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"titulo": "Cadeira de rodas dobrável", "descricao": "Pouco usada",
                                 "localizacao": {"bairro": "Savassi", "cidade": "Belo Horizonte"}}
                                """))
                .andExpect(status().isOk());

        Document doacao = banco.getCollection("doacoes").find().first();
        assertThat(doacao).isNotNull();
        assertThat(doacao.getString("doadorId")).isEqualTo(donoId);
        assertThat(doacao.getString("situacao")).isEqualTo("RASCUNHO");
        assertThat(doacao.getString("titulo")).isEqualTo("Cadeira de rodas dobrável");
        assertThat(doacao.getString("descricao")).isEqualTo("Pouco usada");
        assertThat(doacao.get("localizacao", Document.class)).containsEntry("bairro", "Savassi");

        // Outra pessoa não consegue apagar o rascunho; o dono consegue, e ele sai do banco.
        cadastrar("joao@email.com");
        String outro = entrar("joao@email.com", "segredo123");
        mvc.perform(delete("/api/doacoes/" + id).header("Authorization", "Bearer " + outro))
                .andExpect(status().isForbidden());
        assertThat(banco.getCollection("doacoes").countDocuments()).isEqualTo(1);

        mvc.perform(delete("/api/doacoes/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().is2xxSuccessful());
        assertThat(banco.getCollection("doacoes").countDocuments()).isZero();
    }

    @Test
    void categoriasIniciaisSaoCriadasNaPrimeiraSubida() {
        assertThat(banco.getCollection("categorias").countDocuments()).isPositive();
    }
}
