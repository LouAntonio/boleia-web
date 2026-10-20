import { useEffect, useState } from 'react';

/**
 * URL local (`blob:`) para pré-visualizar um ficheiro ainda não enviado.
 *
 * O object URL vive enquanto o ficheiro estiver no formulário e é revogado na
 * troca ou no unmount — sem isso, cada fotografia escolhida ficava na memória
 * do browser até se fechar o separador. Também não pode ser criado dentro do
 * `render`: cada render fazia um URL novo e perdia o anterior.
 */
export function useObjectUrl(file: File | null): string | null {
	const [url, setUrl] = useState<string | null>(null);

	useEffect(() => {
		if (!file) {
			setUrl(null);
			return;
		}
		const next = URL.createObjectURL(file);
		setUrl(next);
		return () => URL.revokeObjectURL(next);
	}, [file]);

	return url;
}
