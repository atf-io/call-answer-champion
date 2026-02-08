const TrustLogos = () => {
  return (
    <section className="py-16 relative border-t border-b border-border/30">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider">
          500+ teams supercharge their service with Kinch AI
        </p>
        <div className="flex items-center justify-center gap-12 flex-wrap opacity-50">
          {/* Placeholder logos - these would be replaced with actual company logos */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-8 w-24 bg-muted-foreground/20 rounded"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustLogos;
