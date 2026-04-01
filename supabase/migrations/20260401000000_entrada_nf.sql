-- Tabela movimentos_estoque (expande entradas)
ALTER TABLE movimentos_estoque ADD COLUMN nf_numero VARCHAR(50), ADD COLUMN nf_serie VARCHAR(10), ADD COLUMN fornecedor_id INT;

-- Tabela formacao_preco_log (auditoria cálculos)
CREATE TABLE formacao_preco_log (
    id SERIAL PRIMARY KEY,
    produto_id INT REFERENCES produtos(id),
    custo_inicial DECIMAL(10,2),
    impostos_rs DECIMAL(10,2),
    impostos_pct DECIMAL(5,2),
    despesa_admin_rs DECIMAL(10,2),
    despesa_admin_pct DECIMAL(5,2),
    margem_lucro_pct DECIMAL(5,2),
    preco_venda_calculado DECIMAL(10,2),
    preco_promocao DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
