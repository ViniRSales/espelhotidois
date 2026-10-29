package br.pucminas.doapp.model;

/** Localização aproximada de uma doação: só bairro e cidade, nunca o endereço exato. */
public record Localizacao(String bairro, String cidade) {
}
