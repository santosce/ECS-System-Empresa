# ========================================
# GUIA DE MENSAGENS DE COMMIT
# ========================================

Use este guia para escrever mensagens de commit claras e padronizadas!

## ESTRUTURA BÁSICA

[TIPO]: Descrição curta (até 50 caracteres)

Descrição detalhada (opcional, se necessário)

## TIPOS DE COMMIT

✨ feat:     Nova funcionalidade
🐛 fix:      Correção de bug
📝 docs:     Documentação
💄 style:    Formatação, espaços, etc (sem mudança de código)
♻️  refactor: Refatoração de código
⚡ perf:     Melhoria de performance
✅ test:     Adição ou correção de testes
🔧 chore:    Tarefas de manutenção, configs
🚀 deploy:   Deploy ou release

## EXEMPLOS BONS

feat: Adicionar botão de compartilhar no perfil
fix: Corrigir erro 404 na página de contato
docs: Atualizar README com instruções de instalação
style: Ajustar espaçamento do header
refactor: Simplificar lógica de autenticação
perf: Otimizar carregamento de imagens
test: Adicionar testes para formulário de login
chore: Atualizar dependências do package.json
deploy: Release v1.2.0

## EXEMPLOS RUINS (NÃO FAZER)

❌ "alterações"
❌ "fix"
❌ "atualização"
❌ "mudanças no código"
❌ "WIP"
❌ "teste"
❌ "asdfasdf"

## DICAS

1. Use verbos no imperativo: "Adicionar", "Corrigir", "Atualizar"
2. Seja específico sobre o que mudou
3. Não termine com ponto final
4. Mantenha a primeira linha curta (até 50 caracteres)
5. Se precisar de mais detalhes, pule uma linha e escreva abaixo

## EXEMPLOS COMPLETOS

feat: Adicionar validação de CPF no formulário

- Implementa máscara de CPF
- Adiciona validação com algoritmo oficial
- Exibe mensagem de erro para CPFs inválidos

---

fix: Corrigir cálculo de desconto no carrinho

O desconto percentual não estava sendo aplicado
corretamente quando havia cupom promocional ativo.

---

## COMMIT MESSAGES EM PORTUGUÊS OU INGLÊS?

✅ Escolha um idioma e use sempre o mesmo
✅ Neste guia, usamos português para facilitar
✅ Se trabalhar em equipe internacional, use inglês

## QUANDO COMMITAR?

✅ Após completar uma funcionalidade pequena
✅ Após corrigir um bug
✅ Antes de mudar de contexto
✅ Pelo menos uma vez por dia
✅ Antes de fazer merge

❌ Não faça commits muito grandes
❌ Não faça commits com código quebrado (exceto em branch de dev)
