export default function DatePicker({ horizon, selectedKey, onSelect }) {
  return (
    <div className="date-picker" role="tablist" aria-label="Tag auswählen">
      {horizon.map((d) => (
        <button
          key={d.key}
          role="tab"
          aria-selected={d.key === selectedKey}
          className={`date-btn ${d.key === selectedKey ? "active" : ""}`}
          onClick={() => onSelect(d.key)}
        >
          <span className="date-weekday">{d.isToday ? "Heute" : d.weekday}</span>
          <span className="date-label">{d.label}</span>
        </button>
      ))}
    </div>
  );
}
