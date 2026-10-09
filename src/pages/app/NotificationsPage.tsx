import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellOff, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../../lib/api';
import { qk } from '../../lib/queryClient';
import { apiErrorMessage } from '../../lib/axios';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonLine } from '../../components/ui/Skeleton';
import { fmtDate } from '../../lib/format';

/**
 * Como um aviso se traduz para um selo.
 *
 * `RIDE` e `BOOKING` são as que interestam a uma pessoa a caminho. `SYSTEM` é
 * sobre a conta; `PROMOTION` é sobre marketing, e misturar as duas com as
 * primeiras fazia com que alguém ignorasse o "a tua conta foi suspensa" porque
 * estava habituado a ignorar o ecrã.
 */
const TYPE_META: Record<string, { label: string; className: string }> = {
	RIDE: { label: 'Boleia', className: 'bg-brand-soft text-brand-text' },
	BOOKING: { label: 'Reserva', className: 'bg-brand-soft text-brand-text' },
	PAYMENT: { label: 'Pagamento', className: 'bg-caution text-caution-ink' },
	SYSTEM: { label: 'Conta', className: 'bg-canvas text-muted' },
	PROMOTION: { label: 'Novidades', className: 'bg-canvas text-muted' },
};

export function NotificationsPage() {
	usePageTitle('Notificações');

	const { data, isPending } = useQuery({
		queryKey: qk.notifications,
		queryFn: () => api.fetchNotifications({ limit: 50 }),
	});

	const queryClient = useQueryClient();

	const markAll = useMutation({
		mutationFn: api.markAllNotificationsRead,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.notifications });
			queryClient.invalidateQueries({ queryKey: qk.unreadCount });
			toast.success('Todas marcadas como lidas');
		},
		onError: (error: unknown) => {
			toast.error(
				apiErrorMessage(error, 'Não foi possível marcar como lidas.'),
			);
		},
	});

	const markOne = useMutation({
		mutationFn: (id: string) => api.markNotificationRead(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: qk.notifications });
			queryClient.invalidateQueries({ queryKey: qk.unreadCount });
		},
	});

	const rows = data?.rows ?? [];
	const unread = data?.unread ?? 0;

	return (
		<div className="flex flex-col gap-8">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-h2 text-ink">Notificações</h1>
					<p className="mt-2 text-body text-muted">
						{unread > 0 ? `${unread} por ler.` : 'Está tudo lido.'}
					</p>
				</div>

				{unread > 0 ? (
					<Button
						variant="secondary"
						onClick={() => markAll.mutate()}
						disabled={markAll.isPending}
					>
						<CheckCheck size={16} aria-hidden="true" />
						Marcar todas como lidas
					</Button>
				) : null}
			</header>

			{isPending ? (
				<div className="flex flex-col gap-3">
					<SkeletonLine className="h-20 w-full" />
					<SkeletonLine className="h-20 w-full" />
					<SkeletonLine className="h-20 w-full" />
				</div>
			) : null}

			{!isPending && rows.length === 0 ? (
				<EmptyState
					icon={<BellOff size={32} />}
					title="Sem notificações"
					description="Avisamos aqui quando alguém pede um lugar numa boleia tua, e quando o motorista responde."
				/>
			) : null}

			{rows.length > 0 ? (
				<ul className="flex flex-col gap-2">
					{rows.map((notification) => {
						// Um tipo que este site não conhece mostra-se neutro com o
						// próprio nome, em vez de se esconder ou de partir a lista.
						const typeMeta = TYPE_META[notification.type] ?? {
							label: notification.type,
							className: 'bg-canvas text-muted',
						};
						return (
							<li key={notification.id}>
								<button
									type="button"
									onClick={() => {
										if (!notification.read) {
											markOne.mutate(notification.id);
										}
									}}
									className={[
										'w-full rounded-lg border p-4 text-left transition-colors',
										notification.read
											? 'border-line bg-surface'
											: 'border-brand/30 bg-brand-soft/30',
									].join(' ')}
								>
									<div className="flex flex-wrap items-center gap-3">
										<span
											className={`rounded-full px-2.5 py-1 text-small font-medium ${typeMeta.className}`}
										>
											{typeMeta.label}
										</span>

										{!notification.read ? (
											<span className="flex items-center gap-1.5 text-small font-medium text-brand-text">
												<span
													aria-hidden="true"
													className="h-1.5 w-1.5 rounded-full bg-brand"
												/>
												Por ler
											</span>
										) : null}

										<span className="ml-auto text-small text-muted">
											{fmtDate(notification.createdAt)}
										</span>
									</div>

									<p className="mt-2.5 text-body text-ink">
										{notification.title}
									</p>
									<p className="mt-1 text-small text-muted">
										{notification.message}
									</p>
								</button>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
}
