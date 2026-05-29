class PromptGuard:
    blocked_terms = (".env real", "commitar secret", "remover testes", "desabilitar lint")

    def annotate(self, prompt: str) -> str:
        lowered = prompt.lower()
        if any(term in lowered for term in self.blocked_terms):
            return (
                f"{prompt}\n\n"
                "Observação de segurança: se o pedido envolver secrets, .env real ou enfraquecimento "
                "de qualidade, recuse essa parte e proponha uma alternativa segura."
            )
        return prompt
