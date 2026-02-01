import angiLogo from "@/assets/integrations/angi.svg";
import googleLogo from "@/assets/integrations/google-lsa.png";
import zillowLogo from "@/assets/integrations/zillow.svg";
import homeadvisorLogo from "@/assets/integrations/homeadvisor.svg";
import yelpLogo from "@/assets/integrations/yelp.png";

interface Integration {
  name: string;
  logo?: string;
  fallbackLetter?: string;
  color: string;
}

const integrations: Integration[] = [
  {
    name: "Angi",
    logo: angiLogo,
    color: "from-red-500 to-red-600",
  },
  {
    name: "Thumbtack",
    fallbackLetter: "T",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Google LSA",
    logo: googleLogo,
    color: "from-white to-gray-100",
  },
  {
    name: "Modernize",
    fallbackLetter: "M",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Nextdoor",
    fallbackLetter: "N",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "HomeAdvisor",
    logo: homeadvisorLogo,
    color: "from-orange-400 to-orange-500",
  },
  {
    name: "Yelp",
    logo: yelpLogo,
    color: "from-red-600 to-red-700",
  },
  {
    name: "Zillow",
    logo: zillowLogo,
    color: "from-blue-600 to-blue-700",
  },
];

const Integrations = () => {
  return (
    <section className="py-16 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Integrations
          </p>
          <h3 className="text-xl sm:text-2xl font-semibold">
            Connect Your Lead Sources
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="group flex flex-col items-center gap-3 cursor-pointer"
            >
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 overflow-hidden`}
              >
                {integration.logo ? (
                  <img
                    src={integration.logo}
                    alt={`${integration.name} logo`}
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-white">
                    {integration.fallbackLetter}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {integration.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integrations;
