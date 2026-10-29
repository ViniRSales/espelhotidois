package br.pucminas.doapp.exception;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import br.pucminas.doapp.exception.ErroResposta.CampoInvalido;

/** Converte as exceções da aplicação no formato padronizado {@link ErroResposta}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta> validacao(MethodArgumentNotValidException ex) {
        List<CampoInvalido> campos = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> new CampoInvalido(erro.getField(), erro.getDefaultMessage()))
                .toList();
        var corpo = new ErroResposta(400, "Dados inválidos", "Confira os campos destacados e tente de novo.", campos);
        return ResponseEntity.badRequest().body(corpo);
    }

    @ExceptionHandler(DadosInvalidosException.class)
    public ResponseEntity<ErroResposta> dadosInvalidos(DadosInvalidosException ex) {
        var corpo = new ErroResposta(400, "Dados inválidos", ex.getMessage(), ex.getCampos());
        return ResponseEntity.badRequest().body(corpo);
    }

    @ExceptionHandler(ArquivoMuitoGrandeException.class)
    public ResponseEntity<ErroResposta> arquivoMuitoGrande(ArquivoMuitoGrandeException ex) {
        return responder(HttpStatus.CONTENT_TOO_LARGE, ex.getMessage());
    }

    /** Barrado pelo limite de upload do Spring ({@code spring.servlet.multipart}), antes de chegar ao serviço. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResposta> uploadMuitoGrande(MaxUploadSizeExceededException ex) {
        return responder(HttpStatus.CONTENT_TOO_LARGE, "Esta foto é grande demais. Escolha uma foto menor.");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErroResposta> metodoNaoPermitido(HttpRequestMethodNotSupportedException ex) {
        return responder(HttpStatus.METHOD_NOT_ALLOWED, "Esta operação não existe neste endereço.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta> corpoInvalido(HttpMessageNotReadableException ex) {
        return responder(HttpStatus.BAD_REQUEST, "Não foi possível ler os dados enviados.");
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<ErroResposta> naoEncontrado(RecursoNaoEncontradoException ex) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResposta> rotaInexistente(NoResourceFoundException ex) {
        return responder(HttpStatus.NOT_FOUND, "Endereço não encontrado.");
    }

    @ExceptionHandler(NaoAutenticadoException.class)
    public ResponseEntity<ErroResposta> naoAutenticado(NaoAutenticadoException ex) {
        return responder(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(AcessoNegadoException.class)
    public ResponseEntity<ErroResposta> acessoNegado(AcessoNegadoException ex) {
        return responder(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(ConflitoException.class)
    public ResponseEntity<ErroResposta> conflito(ConflitoException ex) {
        return responder(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MuitasTentativasException.class)
    public ResponseEntity<ErroResposta> muitasTentativas(MuitasTentativasException ex) {
        return responder(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResposta> inesperado(Exception ex) {
        log.error("Erro inesperado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Algo deu errado do nosso lado. Tente de novo em instantes.");
    }

    private ResponseEntity<ErroResposta> responder(HttpStatus status, String mensagem) {
        return ResponseEntity.status(status).body(ErroResposta.de(status.value(), status.getReasonPhrase(), mensagem));
    }
}
