const integrations = [
  {
    name: "Angi",
    logo: "A",
    color: "from-red-500 to-red-600",
  },
  {
    name: "Thumbtack",
    logo: "T",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Google LSA",
    logo: "G",
    color: "from-green-500 to-yellow-500",
  },
  {
    name: "Modernize",
    logo: "M",
    color: "from-orange-500 to-orange-600",
  },
  {
    name: "Nextdoor",
    logo: "N",
    color: "from-emerald-500 to-emerald-600",
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
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
              >
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {integration.logo}
                </span>
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
