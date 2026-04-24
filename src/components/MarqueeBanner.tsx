const items = [
  "Podcasts", "Annuaire", "Agences & Studios", "Événements", "Région Sud",
  "PACA", "Créateurs audio", "Voix off", "Sound design", "Montage",
  "Studio",
];

const MarqueeBanner = () => {
  const content = items.map((item, i) => (
    <span key={i} className="flex items-center gap-4 shrink-0">
      <span className="uppercase font-display font-semibold text-sm tracking-wider text-background-pure/50">{item}</span>
      <span className="text-primary text-xs">◆</span>
    </span>
  ));

  return (
    <div className="bg-footer py-3 overflow-hidden select-none" aria-hidden="true">
      <div className="flex gap-4 animate-marquee whitespace-nowrap">
        {content}
        {content}
      </div>
    </div>
  );
};

export default MarqueeBanner;
