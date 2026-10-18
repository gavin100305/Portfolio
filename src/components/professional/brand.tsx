export function DotMonogram() {
  const letters = [
    ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  ];
  return <svg viewBox="0 0 40 26" className="h-4 w-6" aria-hidden="true">
    {letters.flatMap((letter, index) => letter.flatMap((row, y) => [...row].map((dot, x) => dot === "1" ?
      <circle key={`${index}-${x}-${y}`} cx={3 + (index * 6 + x) * 3.4} cy={3 + y * 3.4} r="1.1" fill={index === 0 && y === 3 && x === 4 ? "var(--folio-accent)" : "currentColor"} /> : null)))}
  </svg>;
}

