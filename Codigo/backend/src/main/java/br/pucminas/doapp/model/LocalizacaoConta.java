package br.pucminas.doapp.model;

/**
 * Onde a pessoa ou instituição fica: bairro, cidade e sigla do estado (UF), nunca o endereço exato.
 * Vem da sugestão escolhida no cadastro, que o front-end separa nos três campos.
 */
public record LocalizacaoConta(String bairro, String cidade, String uf) {
}
