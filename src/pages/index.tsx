import Head from "next/head";
import { useEffect, useState } from "react";
import { analytics } from "@/utils/analytics";
import { priceLp1 } from "@/utils/lp1";
import Footer from "@/components/Footer";
import { redirect } from "@/utils/redirect";
import posthog from "posthog-js";

function handleCTAClick() {
  analytics.trackCustom('lp1-clicked-form');
  redirect('https://formshare.ai/s/Vkz3Dx3jE8', true);
}

function renderHeroSectionWithPrice() {
  return (
    <section className="hero-bg pt-20 pb-16" role="banner" style={{
      background: "linear-gradient(to bottom right, hsl(35 60% 95%), hsl(0 0% 100%), #b1c4ec)"
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 mt-10 leading-tight">
            Renove sua receita médica sem sair de casa
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-6 max-w-2xl mx-auto">
            Processo 100% online, seguro e regulamentado. Receba em até 24 horas.
          </p>
          <div className="mb-8">
            <div className="inline-flex items-center bg-white rounded-lg px-6 py-3 shadow-md border border-gray-200">
              <span className="text-3xl font-bold text-blue-600 mr-2" style={{ minWidth: 89 }}>R$ {priceLp1}</span>
              <span className="text-gray-600">por receita</span>
              <span className="ml-4 text-sm text-green-600 font-semibold">✓ Economize até R$ 300+</span>
            </div>
          </div>
          <button onClick={handleCTAClick} className="bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg focus-visible" aria-label="Renovar receita médica agora">
            Renovar Minha Receita
          </button>
          <p className="text-sm text-gray-600 mt-4">
            ✓ Regulamentado pelo CFM • ✓ Aceito em todas as farmácias
          </p>
        </div>
      </div>
    </section>
  )
}

function renderHeroSection() {
  return (
    <section className="hero-bg pt-20 pb-16" role="banner" style={{
      background: "linear-gradient(to bottom right, hsl(35 60% 95%), hsl(0 0% 100%), #b1c4ec)"
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 mt-10 leading-tight">
            Renove sua receita médica sem sair de casa
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Processo 100% online, seguro e regulamentado. Receba em até 24 horas.
          </p>
          <button onClick={handleCTAClick} className="bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg focus-visible" aria-label="Renovar receita médica agora">
            Renovar Minha Receita
          </button>
          <p className="text-sm text-gray-600 mt-4">
            ✓ Regulamentado pelo CFM • ✓ Aceito em todas as farmácias
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const [heroWithPrice, setHeroWithPrice] = useState(false);

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      if (posthog.isFeatureEnabled('lp1-with-price') ) {
        setHeroWithPrice(true);
      } else {
        setHeroWithPrice(false);
      }
    })
  }, []);

  return (
    <>
      <Head>
        <title>DrMente</title>
        <meta name="description" content="Renove sua receita médica de ansiedade sem sair de casa. Processo 100% online, seguro e regulamentado. Economize tempo e dinheiro." />
        <meta name="keywords" content="renovar receita médica online, receita médica ansiedade, telemedicina, consulta online" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/logo.svg" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/logo.svg" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://drmente.com/" />
        <meta property="og:title" content="Renovar Receita Médica Online - Rápido e Seguro" />
        <meta property="og:description" content="Renove sua receita médica de ansiedade sem sair de casa. Processo 100% online, seguro e regulamentado." />
        <meta property="og:image" content="https://drmente.com/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://drmente.com/" />
        <meta property="twitter:title" content="Renovar Receita Médica Online - Rápido e Seguro" />
        <meta property="twitter:description" content="Renove sua receita médica de ansiedade sem sair de casa. Processo 100% online, seguro e regulamentado." />
        <meta property="twitter:image" content="https://drmente.com/og-image.jpg" />

        <link rel="canonical" href="https://drmente.com/" />

        {/* FAQ JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Como posso renovar minha receita médica online?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Você preenche um formulário médico, nossa equipe analisa seu histórico e, se aprovado, emitimos sua receita digital em até 24 horas."
                  }
                },
                {
                  "@type": "Question",
                  "name": "O serviço é regulamentado pelo CFM?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim, seguimos todas as normas do Conselho Federal de Medicina para telemedicina e emissão de receitas digitais."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Quanto tempo demora para receber a receita?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Na maioria dos casos, você recebe sua receita digital em até 24 horas após o envio da solicitação."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Posso usar a receita em qualquer farmácia?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim, nossa receita digital é aceita em todas as farmácias do Brasil, seguindo as normas da ANVISA."
                  }
                },
                {
                  "@type": "Question",
                  "name": "E se minha solicitação for negada?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Caso não seja possível emitir a receita, você recebe reembolso integral em até 5 dias úteis."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Meus dados ficam seguros?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Sim, usamos criptografia de ponta e seguimos a LGPD. Seus dados médicos são protegidos com máxima segurança."
                  }
                }
              ]
            })
          }}
        />
      </Head>

      <div className="font-sans text-gray-900 antialiased">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50" role="navigation" aria-label="Navegação principal">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <svg className="h-8 w-8" viewBox="0 0 24 24" role="img" aria-label="Logotipo: cruz médica" xmlns="http://www.w3.org/2000/svg">
                  <title>DrMente</title>
                  <rect x="3" y="3" width="18" height="18" rx="4" fill="#1d4ed8"></rect>
                  <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="text-xl font-bold text-gray-900">DrMente</span>
              </div>
              <button onClick={handleCTAClick} className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus-visible" aria-label="Começar renovação">
                Começar Agora
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        {heroWithPrice ? renderHeroSectionWithPrice() : renderHeroSection()}

        {/* Social Proof */}
        <section className="py-16 bg-white" aria-labelledby="social-proof-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="social-proof-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              O que as pessoas estão dizendo:
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <p className="text-gray-700 italic">&quot;O atendimento foi espetacular, recebi minha receita em 6 horas. Muito prático!&quot;</p>
                </div>
                <p className="font-semibold">Eduardo A., Niterói - RJ</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <p className="text-gray-700 italic">&quot;Já economizei R$ 600 em consultas em apenas 6 meses. Recomendo!&quot;</p>
                </div>
                <p className="font-semibold">Carla M., Salvador - BA</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <p className="text-gray-700 italic">&quot;A plataforma é muito simples de usar e os médicos são muito profissionais.&quot;</p>
                </div>
                <p className="font-semibold">Jorge L., Belo Horizonte - MG</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 bg-gray-50" aria-labelledby="benefits-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="benefits-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              Por que escolher nosso serviço?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Economize Tempo</h3>
                <p className="text-gray-700">Sem filas, sem espera. Processo 100% online em poucos minutos.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Economize Dinheiro</h3>
                <p className="text-gray-700">Pague muito menos que uma consulta particular tradicional.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">100% Seguro</h3>
                <p className="text-gray-700">Médicos licenciados e processo regulamentado pelo CFM.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white" aria-labelledby="how-it-works-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="how-it-works-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              Como funciona em 3 passos simples
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold mb-4">Preencha o Formulário</h3>
                <p className="text-gray-700">Envie suas informações médicas e histórico de forma segura.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold mb-4">Análise Médica</h3>
                <p className="text-gray-700">Nossos médicos analisam seu caso em até 24 horas.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold mb-4">Receba sua Receita</h3>
                <p className="text-gray-700">Receita digital válida em todas as farmácias do Brasil.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-gray-50" aria-labelledby="pricing-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="pricing-heading" className="text-3xl font-bold text-center text-gray-900 mb-4">
              Preço justo e transparente
            </h2>
            <p className="text-center text-gray-600 mb-12">Muito mais barato que uma consulta particular (R$ 300+)</p>
            <div className="max-w-md mx-auto">
              <div className="border-2 border-blue-500 rounded-lg p-8 bg-white shadow-lg text-center">
                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">R$ {priceLp1}</span>
                  <span className="text-gray-600 text-lg">/receita</span>
                </div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Tudo Incluído</h3>
                <ul className="space-y-4 mb-8 text-left">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Renovação em até 24 horas</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Receita digital válida em todas as farmácias</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Análise por médicos licenciados</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Suporte especializado</span>
          </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Reembolso se não aprovado</span>
          </li>
                </ul>
                <button onClick={handleCTAClick} className="cursor-pointer w-full bg-blue-600 text-white py-4 text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors focus-visible">
                  Renovar Minha Receita
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  ✓ Pagamento seguro • ✓ Sem mensalidades
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Deep-dive */}
        <section className="py-16 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="features-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              Tecnologia e segurança de ponta
            </h2>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <svg className="w-8 h-8 text-blue-600 mt-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 1l3 3h4l-3 3 3 3h-4l-3 3-3-3H3l3-3L3 4h4l3-3z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Criptografia Médica</h3>
                      <p className="text-gray-700">Seus dados são protegidos com o mesmo nível de segurança dos bancos.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <svg className="w-8 h-8 text-green-600 mt-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Médicos Licenciados</h3>
                      <p className="text-gray-700">Todos os médicos possuem CRM ativo e especialização comprovada.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <svg className="w-8 h-8 text-purple-600 mt-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Receita Digital</h3>
                      <p className="text-gray-700">Formato oficial da ANVISA, aceito em 100% das farmácias.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <svg className="w-full h-64" viewBox="0 0 400 300" fill="none" aria-hidden="true">
                  <rect x="50" y="50" width="300" height="200" rx="10" fill="#EEF2FF" stroke="#3B82F6" strokeWidth="2"/>
                  <rect x="70" y="80" width="260" height="20" rx="4" fill="#3B82F6"/>
                  <rect x="70" y="120" width="200" height="12" rx="2" fill="#9CA3AF"/>
                  <rect x="70" y="140" width="180" height="12" rx="2" fill="#9CA3AF"/>
                  <rect x="70" y="160" width="220" height="12" rx="2" fill="#9CA3AF"/>
                  <circle cx="320" cy="90" r="8" fill="#10B981"/>
                  <path d="M316 90l2 2 4-4" stroke="white" strokeWidth="2" fill="none"/>
                  <text x="200" y="220" textAnchor="middle" className="text-xs fill-gray-600">Receita Digital Válida</text>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50" aria-labelledby="faq-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="faq-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              Dúvidas Frequentes
            </h2>
            <div className="space-y-6">
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">Como posso renovar minha receita médica online?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Você preenche um formulário médico, nossa equipe analisa seu histórico e, se aprovado, emitimos sua receita digital em até 24 horas.
                </div>
              </details>
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">O serviço é regulamentado pelo CFM?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Sim, seguimos todas as normas do Conselho Federal de Medicina para telemedicina e emissão de receitas digitais.
                </div>
              </details>
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">Quanto tempo demora para receber a receita?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Na maioria dos casos, você recebe sua receita digital em até 24 horas após o envio da solicitação.
                </div>
              </details>
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">Posso usar a receita em qualquer farmácia?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Sim, nossa receita digital é aceita em todas as farmácias do Brasil, seguindo as normas da ANVISA.
                </div>
              </details>
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">E se minha solicitação for negada?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Caso não seja possível emitir a receita, você recebe reembolso integral em até 5 dias úteis.
                </div>
              </details>
              <details className="group">
                <summary className="flex justify-between items-center w-full px-6 py-4 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors focus-visible">
                  <span className="font-semibold text-left">Meus dados ficam seguros?</span>
                  <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-gray-700">
                  Sim, usamos criptografia de ponta e seguimos a LGPD. Seus dados médicos são protegidos com máxima segurança.
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-white" aria-labelledby="trust-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="trust-heading" className="text-3xl font-bold text-center text-gray-900 mb-12">
              Conformidade e Segurança Médica
            </h2>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">CFM</h3>
                <p className="text-sm text-gray-600">Regulamentado pelo Conselho Federal de Medicina</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">LGPD</h3>
                <p className="text-sm text-gray-600">Conformidade total com Lei Geral de Proteção de Dados</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">ANVISA</h3>
                <p className="text-sm text-gray-600">Receitas digitais seguem padrão oficial da ANVISA</p>
              </div>
              <div className="p-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">SSL</h3>
                <p className="text-sm text-gray-600">Criptografia de ponta para proteção total</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-blue-600" role="banner">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Pronto para renovar sua receita médica?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Economize tempo e dinheiro. Processo 100% online e seguro.
            </p>
            <button onClick={handleCTAClick} className="cursor-pointer bg-white text-blue-600 px-8 py-4 text-lg font-semibold rounded-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg focus-visible" aria-label="Começar renovação de receita médica">
              Começar Agora
            </button>
            <p className="text-blue-100 text-sm mt-4">
              ✓ Sem compromisso • ✓ Reembolso garantido se não aprovado
            </p>
        </div>
        </section>

        <Footer />
    </div>
    </>
  );
}
