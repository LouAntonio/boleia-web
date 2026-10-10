import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UNAUTHORISED_EVENT } from './lib/axios';
import { useThemeStore, applyTheme } from './stores/useThemeStore';

import { MarketingLayout } from './components/layout/MarketingLayout';
import { AppShell } from './components/layout/AppShell';
import { RequireAuth, RedirectIfAuthed } from './components/layout/guards';
import { PageSuspense } from './components/layout/Lazy';
import { lazyPage } from './components/layout/lazyPage';

import { Landing } from './pages/Landing';
import { NotFound } from './pages/NotFound';

/*
 * Cada página institucional é o seu próprio bloco, carregado só quando alguém
 * a pede.
 */
const AboutPage = lazyPage(
	() => import('./pages/institutional/AboutPage'),
	'AboutPage',
);
const DriverPage = lazyPage(
	() => import('./pages/institutional/DriverPage'),
	'DriverPage',
);
const SecurityPage = lazyPage(
	() => import('./pages/institutional/SecurityPage'),
	'SecurityPage',
);
const FaqPage = lazyPage(() => import('./pages/institutional/FaqPage'), 'FaqPage');
const ContactPage = lazyPage(
	() => import('./pages/institutional/ContactPage'),
	'ContactPage',
);
const PrivacyPage = lazyPage(
	() => import('./pages/institutional/PrivacyPage'),
	'PrivacyPage',
);
const TermsPage = lazyPage(
	() => import('./pages/institutional/TermsPage'),
	'TermsPage',
);

import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { VerifyPage } from './pages/auth/VerifyPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { ExplorePage } from './pages/app/ExplorePage';
import { RideDetailPage } from './pages/app/RideDetailPage';
import { BookingsPage } from './pages/app/BookingsPage';
import { DriverBoardPage } from './pages/app/DriverBoardPage';
import { PublishRidePage } from './pages/app/PublishRidePage';
import { VehiclesPage } from './pages/app/VehiclesPage';
import { KycPage } from './pages/app/KycPage';
import { NotificationsPage } from './pages/app/NotificationsPage';
import { ProfilePage } from './pages/app/ProfilePage';

/**
 * Uma sessão que caduca a meio de uma sessão de trabalho não pode ser um 401
 * mudo.
 *
 * O interceptor do axios não sabe o que há à volta do pedido — está a meio de um
 * `useQuery`, de um formulário, de nada. Emite um evento, e é aqui que ele é
 * resolvido: a sessão já foi limpa pelo interceptor, falta a pessoa sair com uma
 * explicação em vez de a página ficar a pedir dados que já não vai receber.
 */
function useSessionExpiryNotice(): void {
	const navigate = useNavigate();

	useEffect(() => {
		const onUnauthorised = () => {
			toast.error('A sessão terminou. Entra outra vez para continuar.');
			navigate('/entrar', { replace: true });
		};

		window.addEventListener(UNAUTHORISED_EVENT, onUnauthorised);
		return () => window.removeEventListener(UNAUTHORISED_EVENT, onUnauthorised);
	}, [navigate]);
}

/**
 * O Google devolve a pessoa ao site depois do OAuth. O caminho volta a `/entrar`
 * e é o `SignIn` que troca o código pela sessão — por isso esta página não
 * desenha nada, só esconde o "a carregar" que o componente já põe no ecrã.
 */
function SocialCallbackPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
			<p className="text-body text-muted">A concluir o teu registo…</p>
			<p className="text-small text-muted">
				Se isto demorar, é porque o servidor não respondeu.
			</p>
		</div>
	);
}

export function App() {
	useSessionExpiryNotice();

	/*
	 * O tema é guardado num store, não num estado do `App`. Se estivesse aqui,
	 * trocar o tema recriaria toda a árvore de rotas e a pessoa perderia o
	 * formulário a meio.
	 */
	const theme = useThemeStore((s) => s.theme);
	useEffect(() => applyTheme(theme), [theme]);

	return (
		<PageSuspense>
			<Routes>
				{/* Público */}
				<Route element={<MarketingLayout />}>
					<Route path="/" element={<Landing />} />

					{/*
					 * As páginas institucionais ficam no mesmo grupo que a landing, e não
					 * num grupo à parte: é o que faz o header, o rodapé e a troca de
					 * tema continuarem iguais em todas. O que muda entre elas é o
					 * conteúdo, não o esqueleto.
					 */}
					<Route path="/sobre" element={<AboutPage />} />
					<Route path="/motoristas" element={<DriverPage />} />
					<Route path="/seguranca" element={<SecurityPage />} />
					<Route path="/perguntas" element={<FaqPage />} />
					<Route path="/contacto" element={<ContactPage />} />
					<Route path="/privacidade" element={<PrivacyPage />} />
					<Route path="/termos" element={<TermsPage />} />
				</Route>

				{/* Autenticação. Quem já entrou é levado para a app. */}
				<Route
					element={
						<RedirectIfAuthed>
							<Outlet />
						</RedirectIfAuthed>
					}
				>
					<Route path="/entrar" element={<SignInPage />} />
					<Route path="/criar-conta" element={<SignUpPage />} />
					<Route path="/verificar" element={<VerifyPage />} />
					<Route path="/recuperar" element={<ForgotPasswordPage />} />
					<Route path="/redefinir" element={<ResetPasswordPage />} />
					<Route
						path="/entrar/social/callback"
						element={<SocialCallbackPage />}
					/>
				</Route>

				{/* A app. Tudo aqui exige sessão. */}
				<Route
					element={
						<RequireAuth>
							<AppShell />
						</RequireAuth>
					}
				>
					<Route
						path="/app"
						element={<Navigate to="/app/explorar" replace />}
					/>
					<Route path="/app/explorar" element={<ExplorePage />} />
					<Route path="/app/viagens/:id" element={<RideDetailPage />} />
					<Route path="/app/reservas" element={<BookingsPage />} />
					<Route path="/app/painel" element={<DriverBoardPage />} />
					<Route path="/app/publicar" element={<PublishRidePage />} />
					<Route path="/app/viaturas" element={<VehiclesPage />} />
					<Route path="/app/kyc" element={<KycPage />} />
					<Route
						path="/app/notificacoes"
						element={<NotificationsPage />}
					/>
					<Route path="/app/perfil" element={<ProfilePage />} />
				</Route>

				{/*
				 * A 404 é uma rota de topo, não está dentro do `MarketingLayout`.
				 * Dentro, herdava o cabeçalho branco da landing por cima do fundo
				 * preto da página, e o rodapé institucional em baixo do outro.
				 */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</PageSuspense>
	);
}
