import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { apiErrorMessage } from '../../lib/axios';
import { authClient } from '../../lib/auth-client';
import { useAuthStore } from '../../stores/useAuthStore';
import { maskPhone } from '../../lib/phone';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { Card } from '../ui/Card';

/**
 * Troca do número de telefone, por código de WhatsApp para o número novo.
 *
 * Fica num componente próprio porque tem de aparecer em dois sítios —
 * `/app/conta` e o separador "Conta" do perfil — e um formulário copiado
 * duas vezes é um formulário que emenda numa parte e parte na outra.
 *
 * O fluxo é do backend: `POST /api/account/phone/request` envia o código ao
 * número que a pessoa escreveu, e `POST /api/account/phone/confirm` valida-o
 * e grava. O `otp` só volta na resposta quando o backend está com o preview
 * ligado — a muleta temporária enquanto o WAME não entrega — e vai num
 * toast. Quando a entrega a sério ficar a funcionar, o toast apaga-se e o
 * resto do fluxo fica igual.
 */
export function PhoneChangeCard() {
	const currentPhone = useAuthStore((s) => s.user?.phone ?? '');
	// A troca derruba as outras sessões no servidor. A sessão deste
	// dispositivo sobrevive, mas refrescar garante que o número antigo não
	// continue no cabeçalho depois da troca.
	const refetchSession = authClient.useSession().refetch;

	const [phone, setPhone] = useState('');
	const [code, setCode] = useState('');
	// O número que está à espera do código. `null` = nenhum pedido em curso;
	// é ele que escolhe o formulário — e não um booleano solto.
	const [pendingPhone, setPendingPhone] = useState<string | null>(null);

	const reset = () => {
		setPendingPhone(null);
		setCode('');
	};

	const request = useMutation({
		mutationFn: (value: string) => api.requestPhoneChange(value),
		onSuccess: (response) => {
			setPendingPhone(response.phone);
			setPhone('');
			toast.success('Código enviado por WhatsApp');
			if (response.otp) {
				toast(`Código (pré-visualização): ${response.otp}`, {
					duration: 10000,
				});
			}
		},
		onError: (error: unknown) => {
			toast.error(apiErrorMessage(error, 'Não foi possível pedir o código.'));
		},
	});

	const confirm = useMutation({
		mutationFn: (value: string) => api.confirmPhoneChange(value),
		onSuccess: async (response) => {
			reset();
			await refetchSession();
			toast.success(`Número trocado para ${response.phone}.`);
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(
					error,
					'Código errado ou expirado. Pede outro e tenta de novo.',
				),
			);
		},
	});

	return (
		<Card className="p-6">
			<h2 className="text-h3 text-ink">Número de telefone</h2>
			<p className="mt-1.5 text-small text-muted">
				{explanation(currentPhone)}
			</p>

			{pendingPhone === null ? (
				<form
					className="mt-5 flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (phone.trim().length < 9) {
							toast.error(
								'Escreve o número completo, com 9 dígitos.',
							);
							return;
						}
						request.mutate(phone.trim());
					}}
				>
					<Field
						label="Número novo"
						value={phone}
						onChange={(e) => setPhone(maskPhone(e.target.value))}
						inputMode="tel"
						placeholder="9xx xxx xxx"
						hint="Recebes um código por WhatsApp neste número."
					/>
					<div>
						<Button
							type="submit"
							disabled={request.isPending || !phone.trim()}
						>
							{request.isPending ? 'A enviar…' : 'Pedir código'}
						</Button>
					</div>
				</form>
			) : (
				<form
					className="mt-5 flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						if (code.trim().length !== 6) {
							toast.error('O código tem 6 dígitos.');
							return;
						}
						confirm.mutate(code.trim());
					}}
				>
					<p className="text-small text-muted">
						Código enviado para {pendingPhone}. Não chegou? Volta atrás
						e pede outro.
					</p>
					<Field
						label="Código"
						value={code}
						onChange={(e) =>
							setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
						}
						inputMode="numeric"
						placeholder="••••••"
						autoComplete="one-time-code"
					/>
					<div className="flex flex-wrap gap-3">
						<Button
							type="submit"
							disabled={code.length !== 6 || confirm.isPending}
						>
							{confirm.isPending
								? 'A confirmar…'
								: 'Confirmar código'}
						</Button>
						<Button variant="ghost" onClick={reset}>
							Usar outro número
						</Button>
					</div>
				</form>
			)}
		</Card>
	);
}

function explanation(currentPhone: string): string {
	if (!currentPhone) {
		return 'A tua conta ainda não tem número associado.';
	}
	return `O número de entrada nesta conta é ${currentPhone}. Trocar exige provar que recebes o código no número novo — é este check que impede a conta de ser levada por quem só sabe o teu email.`;
}
