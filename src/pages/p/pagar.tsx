import { useEffect, useState } from "react";
import Head from "next/head";
import Footer from "@/components/Footer";
import { analytics } from "@/utils/analytics";
import { redirect } from "@/utils/redirect";
import { priceLp1 } from "@/utils/lp1";

export default function PagamentoSucesso() {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState(0);

  const statusTexts = [
    "Confirmando seus dados...",
    "Gerando sua receita...",
    "Redirecionando para o pagamento..."
  ];


  const secondsToRedirect = 45;

  function redirectToPayment(newTab: boolean = false) {
    analytics.trackCustom('lp1-redirecting-to-payment');
    // if (process.env.NODE_ENV !== 'development') {
      redirect('https://buy.stripe.com/8x228q4U9foG3ked9G1ZS08', newTab);
    // }
  }

  function clickToRedirectToPayment() {
    analytics.trackCustom('lp1-clicked-to-payment');
    redirectToPayment(true);
  }

  // Track conversion events once
  useEffect(() => {
    analytics.trackLead();
    analytics.trackCustom('lp1-completed-form');
  }, []);

  useEffect(() => {
    // Animate progress bar from 0 to 100 over 3 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            redirectToPayment(false);
          }, 500);
          return 100;
        }
        return prev + 1;
      });
    }, secondsToRedirect * 10);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress <= 20) {
      setCurrentText(0);
    } else if (progress <= 75) {
      setCurrentText(1);
    } else if (progress <= 100) {
      setCurrentText(2);
    }

  }, [progress]);

  return (
    <>
      <Head>
        <title>DrMente - Pagamento Confirmado</title>
        <meta name="description" content="Sucesso! Seu pedido foi registrado. Finalize o pagamento para receber sua receita." />
        <meta name="keywords" content="pagamento confirmado, receita médica online, telemedicina" />
        <link rel="canonical" href="https://drmente.com/p/pagamento-sucesso" />

        {/* Open Graph */}
        <meta property="og:title" content="Pagamento Confirmado - DrMente" />
        <meta property="og:description" content="Sucesso! Seu pedido foi registrado. Finalize o pagamento para receber sua receita." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://drmente.com/p/pagamento-sucesso" />
        <meta property="og:image" content="https://drmente.com/og-pagamento.jpg" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pagamento Confirmado - DrMente" />
        <meta name="twitter:description" content="Sucesso! Seu pedido foi registrado. Finalize o pagamento para receber sua receita." />
        <meta name="twitter:image" content="https://drmente.com/og-pagamento.jpg" />
      </Head>

      <div className="antialiased text-slate-900 bg-white min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:px-3 focus:py-2 focus:rounded">
          Pular para o conteúdo
        </a>

        {/* Header */}
        <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30" role="banner">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between" aria-label="Principal">
            <svg className="h-8 w-8" viewBox="0 0 24 24" role="img" aria-label="Logotipo: cruz médica" xmlns="http://www.w3.org/2000/svg">
              <title>DrMente</title>
              <rect x="3" y="3" width="18" height="18" rx="4" fill="#1d4ed8"></rect>
              <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-semibold tracking-tight">DrMente</span>
            <div className="flex items-center gap-3">
              <a href="#faq" className="text-sm hover:underline">FAQ</a>
              <a href="#contato" className="text-sm hover:underline">Contato</a>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main id="main" role="main" className="flex-1">
          <section className="hero" style={{
            background: "linear-gradient(to bottom right, hsl(35 60% 95%), hsl(0 0% 100%), #b1eccd)"
          }}>
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
              <div className="text-center">
                {/* Success Icon */}
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>

                {/* Success Message */}
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                  Sucesso, seu pedido foi registrado.
                </h1>

                <p className="text-lg text-slate-700 mb-8 max-w-2xl mx-auto">
                  Para dar continuidade, para receber sua receita apenas finalize o pagamento a seguir, no valor de <strong className="text-green-600">R$ {priceLp1}</strong>.
                </p>

                {/* Progress Bar Container */}
                {/* <div className="max-w-md mx-auto mb-8">
                  <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 transition-all duration-500">
                    {statusTexts[currentText]}
                  </p>
                </div> */}

                {/* Payment Button (as fallback) */}
                <div className="mt-8">
                  <button
                    onClick={clickToRedirectToPayment}
                    className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                    aria-label="Finalizar pagamento"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                    Finalizar Pagamento - R$ {priceLp1}
                  </button>
                </div>

                {/* Additional Info */}
                <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-3">O que acontece após o pagamento?</h3>
                  <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Confirmação imediata
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Processamento em até 24h
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Receita enviada por email
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" aria-labelledby="faq-heading" className="py-16 bg-slate-50">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
              <h2 id="faq-heading" className="text-2xl font-bold text-center mb-8">Dúvidas sobre o pagamento?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    O pagamento é seguro?
                  </summary>
                  <p className="mt-2 text-slate-700">Sim, utilizamos criptografia SSL e processadores de pagamento certificados.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Posso cancelar após pagar?
                  </summary>
                  <p className="mt-2 text-slate-700">Sim, seguimos nossa política de reembolso conforme termos de uso.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Quando recebo a receita?
                  </summary>
                  <p className="mt-2 text-slate-700">Após confirmação do pagamento, processamos em até 24 horas úteis.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Preciso de ajuda?
                  </summary>
                  <p className="mt-2 text-slate-700">Entre em contato pelo WhatsApp ou email: mente@dr.com</p>
                </details>
              </div>
            </div>
          </section>

          {/* Contato / Confiança */}
          <section id="contato" aria-labelledby="contato-heading" className="py-12">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 id="contato-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">Precisa falar com a gente?</h2>
              <div className="mt-6 grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-semibold">Suporte</h3>
                  <p className="mt-1 text-slate-700">mente@dr.com</p>
                  <a href="mailto:mente@dr.com" className="mt-3 inline-flex rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300" aria-label="Escrever para o suporte">
                    Enviar e-mail
                  </a>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-semibold">WhatsApp</h3>
                  <p className="mt-1 text-slate-700">Atendimento em horário comercial.</p>
                  <a href="https://wa.me/5531971689316?text=Olá,%20preciso%20de%20ajuda%20para%20renovar%20minha%20receita%20médica" target="_blank" className="cursor-pointer mt-3 inline-flex rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300" aria-label="Abrir WhatsApp">
                    Abrir WhatsApp
                  </a>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-semibold">Privacidade</h3>
                  <p className="mt-1 text-slate-700">Seus dados são tratados conforme LGPD.</p>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600" aria-label="Selos de confiança">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" role="img" aria-label="Cadeado" xmlns="http://www.w3.org/2000/svg">
                      <title>Segurança</title>
                      <path d="M6 10h12v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9z" fill="#0f172a"/>
                      <path d="M8 10V7a4 4 0 1 1 8 0v3" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Criptografia e auditoria clínica</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-20 mb-8">
              {/* CTA Section */}
              <div className="text-center bg-slate-900 rounded-2xl p-8 text-white">
                <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                  Finalize o pagamento e receba sua receita médica digital em até 24 horas.
                </p>
                <button
                  onClick={clickToRedirectToPayment}
                  className="inline-flex items-center rounded-xl bg-green-600 px-8 py-4 text-white font-semibold shadow-lg hover:bg-green-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  aria-label="Emitir receita médica"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Emitir Receita - R$ {priceLp1}
                </button>
                <p className="text-slate-400 text-sm mt-4">
                  ✓ Pagamento seguro • ✓ Reembolso garantido se não aprovado
                </p>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
