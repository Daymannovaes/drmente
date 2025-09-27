import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <svg className="h-8 w-8" viewBox="0 0 24 24" role="img" aria-label="Logotipo: cruz médica" xmlns="http://www.w3.org/2000/svg">
                <title>DrMente</title>
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#1d4ed8"></rect>
                <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xl font-bold text-white">DrMente</span>
            </div>
            <p className="text-sm">
              Renovação de receitas médicas de forma segura, rápida e regulamentada.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="hover:text-white transition-colors focus-visible">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors focus-visible">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition-colors focus-visible">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors focus-visible">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="hover:text-white transition-colors focus-visible">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <a href="mailto:mente@dr.com" className="hover:text-white transition-colors focus-visible">
                  mente@dr.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-4">Médico?</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/trabalhe-conosco" className="hover:text-white transition-colors focus-visible">
                  Trabalhe Conosco
                </Link>
              </li>
              <li>
                <Link href="/parceiros" className="hover:text-white transition-colors focus-visible">
                  Parceiros
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p className="mb-4">
            <strong>Aviso Médico:</strong> Este serviço é destinado exclusivamente para renovação de receitas médicas já estabelecidas. Não substitui consulta médica completa. Em caso de dúvidas sobre sua condição de saúde, consulte um médico presencialmente.
          </p>
          <p>&copy; {new Date().getFullYear()} DrMente. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
