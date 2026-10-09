interface ConsentRowProps {
	terms: boolean;
	marketing: boolean;
	onTermsChange: (value: boolean) => void;
	onMarketingChange: (value: boolean) => void;
	error?: string | null;
	disabled?: boolean;
}

/**
 * Os consentimentos.
 *
 * Os termos são obrigatórios e o marketing não. A diferença não é um detalhe de
 * interface: os termos são a condição de usar a conta, e o marketing é uma
 * escolha de quem pode recusar sem perder nada.
 *
 * Os links vão para `/#termos` e `/#privacidade` — que são secções do rodapé.
 * Numa v1 sem páginas de termos escritas, o que há para ler é este texto e o
 * que está no rodapé. Um link para uma página inexistente seria pior do que
 * dizer onde está a informação.
 */
export function ConsentRow({
	terms,
	marketing,
	onTermsChange,
	onMarketingChange,
	error,
	disabled = false,
}: ConsentRowProps) {
	return (
		<fieldset className="flex flex-col gap-3" disabled={disabled}>
			<legend className="sr-only">Termos e novidades</legend>

			<label className="flex cursor-pointer items-start gap-3">
				<input
					type="checkbox"
					checked={terms}
					onChange={(event) => onTermsChange(event.target.checked)}
					required
					aria-invalid={error ? true : undefined}
					aria-describedby={error ? 'consentimento-erro' : undefined}
					className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
				/>
				<span className="text-small text-muted">
					Li e aceito os{' '}
					<a
						href="/#termos"
						className="rounded-sm text-brand-text underline-offset-4 hover:underline"
					>
						termos de uso
					</a>{' '}
					e a{' '}
					<a
						href="/#privacidade"
						className="rounded-sm text-brand-text underline-offset-4 hover:underline"
					>
						política de privacidade
					</a>
					.
				</span>
			</label>

			<label className="flex cursor-pointer items-start gap-3">
				<input
					type="checkbox"
					checked={marketing}
					onChange={(event) => onMarketingChange(event.target.checked)}
					className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
				/>
				<span className="text-small text-muted">
					Quero receber novidades sobre rotas e preços por WhatsApp. Podes
					desligar quando quiseres.
				</span>
			</label>

			{error ? (
				<p
					id="consentimento-erro"
					role="alert"
					className="text-small text-alert"
				>
					{error}
				</p>
			) : null}
		</fieldset>
	);
}
