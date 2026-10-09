import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
	title: string;
	description?: string;
	onClose?: () => void;
	children: ReactNode;
}

/**
 * Uma janela por cima da página.
 *
 * Renderizada num `portal` para o `<body>`, e não onde vive no JSX: um `Modal`
 * dentro de um cartão com `overflow: hidden` ou um `transform` no ancestral
 * fica preso dentro desse cartão. O portal é a única forma de estar sempre no
 * topo.
 *
 * Fecha com `Escape` e com o clique no fundo. Não há animação de entrada: num
 * `Modal` que pede uma decisão — "tens a certeza?" — o atraso entre a pergunta e
 * o aparecimento da janela é tempo em que a pessoa já carregou no sítio errado.
 */
export function Modal({ title, description, onClose, children }: ModalProps) {
	useEffect(() => {
		if (!onClose) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};

		document.addEventListener('keydown', onKey);

		// O fundo não deve rolar enquanto há uma decisão pendente.
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', onKey);
			document.body.style.overflow = previous;
		};
	}, [onClose]);

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
			{/* O fundo. Separado do conteúdo para o clique não fechar ao clicar
			    dentro — senão metade dos "cancelas?" fechava-se ao responder. */}
			<button
				type="button"
				aria-label="Fechar"
				onClick={onClose}
				tabIndex={-1}
				className="absolute inset-0 bg-black/50"
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-lg border border-line bg-surface p-6 sm:rounded-lg"
			>
				<header className="flex items-start justify-between gap-4">
					<div>
						<h2 className="text-h3 text-ink">{title}</h2>
						{description ? (
							<p className="mt-1.5 text-body text-muted">
								{description}
							</p>
						) : null}
					</div>

					{onClose ? (
						<button
							type="button"
							onClick={onClose}
							aria-label="Fechar"
							className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-canvas hover:text-ink"
						>
							<X size={18} aria-hidden="true" />
						</button>
					) : null}
				</header>

				<div className="mt-6">{children}</div>
			</div>
		</div>,
		document.body,
	);
}
