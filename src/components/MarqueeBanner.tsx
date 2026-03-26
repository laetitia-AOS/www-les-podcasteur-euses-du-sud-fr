const items = [
  "Podcasts", "Annuaire", "Agences & Studios", "Événements", "Région Sud",
  "PACA", "Créateurs audio", "Voix off", "Sound design", "Montage",
  "Interviews", "Documentaires", "Fiction", "Marseille", "Nice", "Toulon",
];

const MarqueeBanner = () => {
  const content = items.map((item, i) => (
    <span key={i} className="flex items-center gap-4 shrink-0">
      <span className="uppercase font-display font-bold text-sm tracking-wider">{item}</span>
      <span className="text-secondary text-xs">★</span>
    </span>
  ));

  return (
    <div className="bg-primary py-3 overflow-hidden select-none" aria-hidden="true">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {content}
        {content}
      </div>
    </div>
  );
};

export default MarqueeBanner;
