import type { ReactNode } from 'react';

interface CardProps {
	children?: ReactNode;
	className?: string;
	as?: 'div' | 'article' | 'li' | 'section';
}

/**
 * A superfície elevada do sistema. Um cartão, e só um: sem sombra por omissão.
 *
 * `children` é opcional porque também se usa como moldura de esqueleto, onde o
 * conteúdo ainda não existe. Exigir children para desenhar um "vazio" obrigava a
 * meter um espaço dentro só para satisfazer o tipo.
 */
export function Card({ children, className = '', as: Tag = 'div' }: CardProps) {
	return (
		<Tag className={`rounded-lg border border-line bg-surface ${className}`}>
			{children}
		</Tag>
	);
}
