import toast from 'react-hot-toast';

/**
 * Mostra o OTP devolvido pelo backend, enquanto o WAME não tiver uma instância
 * ligada. Sem `otp`, fica a mensagem genérica de sempre.
 *
 * O tempo é maior do que o de um toast normal: o código tem de dar para ler e
 * escrever no formulário seguinte.
 */
export function showOtpToast(otp: string | undefined, fallback: string): void {
	if (otp) {
		toast.success(`Código de verificação: ${otp}`, { duration: 15_000 });
		return;
	}
	toast.success(fallback);
}
