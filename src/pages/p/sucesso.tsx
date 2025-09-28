import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { analytics } from "@/utils/analytics";
import Footer from "@/components/Footer";

export default function Sucesso() {
  const [protocolo, setProtocolo] = useState(" ");
  const [email, setEmail] = useState(" ");

  useEffect(() => {
    // Lê parâmetros da URL para exibir protocolo e e-mail
    const params = new URLSearchParams(window.location.search);
    const proto = params.get('protocolo') || params.get('protocol') || params.get('p') || "";
    const mail = params.get('email') || params.get('e') || "";
    setProtocolo(proto);
    setEmail(mail);

    console.log(protocolo, email);
  }, [protocolo, email]);

  // Track conversion events once
  useEffect(() => {
    analytics.trackLead();
    analytics.trackCustom('lp1-payment-success');
  }, []);

  return (
    <>
      <Head>
        <title>DrMente - Sucesso</title>
        <meta name="description" content="Sucesso! Recebemos seu pedido. Estamos processando e entraremos em contato em breve." />
        <meta name="keywords" content="renovar receita médica online, confirmação de pedido, telemedicina" />
        <link rel="canonical" href="https://drmente.com/p/sucesso" />

        {/* Open Graph */}
        <meta property="og:title" content="Sucesso! Estamos processando seu pedido" />
        <meta property="og:description" content="Recebemos seu pedido. Acompanhe o protocolo e saiba os próximos passos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://drmente.com/p/sucesso" />
        <meta property="og:image" content="https://drmente.com/og-sucesso.jpg" />
        <meta property="og:locale" content="pt_BR" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sucesso! Estamos processando seu pedido" />
        <meta name="twitter:description" content="Recebemos seu pedido. Acompanhe o protocolo e saiba os próximos passos." />
        <meta name="twitter:image" content="https://drmente.com/og-sucesso.jpg" />

        {/* JSON-LD para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Quando vocês entram em contato?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Entramos em contato assim que a revisão inicial termina. Normalmente, ainda hoje."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Preciso enviar mais documentos?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Se necessário, pediremos por e-mail ou WhatsApp. Você pode anexar agora nesta página."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Como acompanho meu protocolo?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Use o número de protocolo exibido aqui para consultar o status por e-mail."
                  }
                },
                {
                  "@type": "Question",
                  "name": "E se a receita não puder ser emitida?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Você receberá orientação clara sobre próximos passos. Reembolsos seguem nossa política."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Meus dados estão protegidos?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. Tratamos dados conforme a LGPD, com criptografia e controles de acesso."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Posso falar com alguém agora?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim. Use o botão de suporte nesta página ou escreva para suporte@drmente.com."
                  }
                }
              ]
            })
          }}
        />
        </Head>

        <div className={`antialiased text-slate-900 bg-white`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:px-3 focus:py-2 focus:rounded">
          Pular para o conteúdo
        </a>

        {/* Header */}
        <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30" role="banner">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between" aria-label="Principal">
            <Link href="/" className="flex items-center gap-2" aria-label="Página inicial">
              <svg className="h-8 w-8" viewBox="0 0 24 24" role="img" aria-label="Logotipo: cruz médica" xmlns="http://www.w3.org/2000/svg">
                <title>DrMente</title>
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#1d4ed8"></rect>
                <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="font-semibold tracking-tight">DrMente</span>
            </Link>
            <div className="flex items-center gap-3">
              <a href="#faq" className="text-sm hover:underline">FAQ</a>
              <a href="#contato" className="text-sm hover:underline">Contato</a>
            </div>
          </nav>
        </header>

        {/* Hero / Confirmação */}
        <main id="main" role="main">
          <section className="hero" style={{
            background: "linear-gradient(to bottom right, hsl(35 60% 95%), hsl(0 0% 100%), #b1eccd)"
          }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                  Sucesso! Estamos processando seu pedido
                </h1>
                <p className="mt-4 text-lg text-slate-700 max-w-prose">
                  Entraremos em contato em breve por e-mail ou WhatsApp.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      document.getElementById('status')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                      });
                    }}
                    className="inline-flex items-center rounded-xl bg-blue-700 px-6 py-3 text-white font-semibold shadow hover:bg-blue-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    aria-label="Ver status do pedido"
                  >
                    Ver status
                  </button>
                </div>
              </div>

              {/* Ilustração */}
              <div className="relative hidden lg:block">
                <svg className="w-full h-auto" viewBox="0 0 600 420" role="img" aria-label="Ilustração: confirmação de pedido em celular" xmlns="http://www.w3.org/2000/svg">
                  <title>Confirmação de pedido</title>
                  <rect x="40" y="40" width="520" height="340" rx="24" fill="#e2e8f0"/>
                  <rect x="120" y="80" width="360" height="260" rx="16" fill="#94a3b8"/>
                  <rect x="160" y="120" width="280" height="40" rx="8" fill="#1d4ed8"/>
                  <rect x="160" y="180" width="220" height="18" rx="4" fill="#334155"/>
                  <rect x="160" y="210" width="180" height="18" rx="4" fill="#334155"/>
                  <rect x="160" y="250" width="160" height="40" rx="10" fill="#16a34a"/>
                  <path d="M178 270l10 10 18-18" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </section>

          {/* Resumo do Pedido */}
          <section id="status" aria-labelledby="status-heading" className="py-12 border-y border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 id="status-heading" className="text-2xl font-bold tracking-tight">Resumo do pedido</h2>
              <div className="mt-6 grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
                  <h3 className="font-semibold">Pedido registrado</h3>
                  <p className="mt-1 text-slate-700 select-all">&nbsp;</p>
                  <p className="mt-2 text-sm text-slate-600">Seu pedido de renovação de receita foi registrado com sucesso.</p>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
                  <h3 className="font-semibold">Dados validados</h3>
                  <p className="mt-1 text-slate-700 break-words">&nbsp;</p>
                  <p className="mt-2 text-sm text-slate-600">Verificamos suas informações pessoais e já foram validadas.</p>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50">
                  <h3 className="font-semibold">Próxima atualização:</h3>
                  <p className="mt-1 text-slate-700">Enviada por e-mail ou WhatsApp.</p>
                  <p className="mt-2 text-sm text-slate-600">Você receberá orientação clara sobre os próximos passos.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Próximos Passos */}
          <section id="steps" aria-labelledby="steps-heading" className="py-16 bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <h2 id="steps-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">O que acontece agora</h2>
              <div className="mt-8 grid sm:grid-cols-3 gap-8">
                <div className="flex items-start gap-4">
                  <svg className="h-10 w-10 shrink-0" viewBox="0 0 24 24" role="img" aria-label="Triagem" xmlns="http://www.w3.org/2000/svg">
                    <title>Triagem</title>
                    <circle cx="12" cy="12" r="10" fill="#1d4ed8"></circle>
                    <path d="M7 12l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <h3 className="font-semibold text-lg">Triagem do pedido</h3>
                    <p className="text-slate-700">Confirmamos dados e documentos enviados.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="h-10 w-10 shrink-0" viewBox="0 0 24 24" role="img" aria-label="Revisão médica" xmlns="http://www.w3.org/2000/svg">
                    <title>Revisão médica</title>
                    <rect x="4" y="4" width="16" height="16" rx="3" fill="#0f172a"></rect>
                    <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <h3 className="font-semibold text-lg">Revisão médica</h3>
                    <p className="text-slate-700">Avaliação responsável do histórico enviado.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <svg className="h-10 w-10 shrink-0" viewBox="0 0 24 24" role="img" aria-label="Retorno" xmlns="http://www.w3.org/2000/svg">
                    <title>Retorno</title>
                    <path d="M6 3h9l3 3v15H6z" fill="#1d4ed8"></path>
                    <path d="M9 12h6M9 16h5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <h3 className="font-semibold text-lg">Retorno e orientações</h3>
                    <p className="text-slate-700">Enviamos atualização e instruções pelo seu contato.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" aria-labelledby="faq-heading" className="py-16 bg-slate-50 border-y border-slate-200">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold tracking-tight">Dúvidas rápidas</h2>
              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Quando recebo a próxima atualização?
                  </summary>
                  <p className="mt-2 text-slate-700">Avisamos assim que a triagem terminar. Geralmente no mesmo dia útil.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Posso corrigir meu e-mail?
                  </summary>
                  <p className="mt-2 text-slate-700">Sim. Escreva para suporte@drmente.com com seu protocolo.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    Como cancelo o pedido?
                  </summary>
                  <p className="mt-2 text-slate-700">Fale com o suporte. Seguimos nossa política de reembolso.</p>
                </details>
                <details className="group border border-slate-200 rounded-xl p-4 bg-white">
                  <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 rounded">
                    A receita é sempre emitida?
                  </summary>
                  <p className="mt-2 text-slate-700">Emitimos apenas quando clinicamente adequado e seguro.</p>
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
              <p className="mt-6 text-sm text-slate-600">
                Aviso: este serviço atende à renovação de receitas de ansiedade já diagnosticada. Não substitui consulta completa. A avaliação é individual.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
