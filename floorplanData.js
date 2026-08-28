// Zentrales Datenmodell für den Grundriss "Raum 3.5".
// Möchtest du später Tische/Räume ändern, ist HIER die einzige Stelle, die
// angepasst werden muss (Layout in FloorPlan.jsx bleibt unverändert).

export const GROUPS_LEFT = [
  { id: "L1", label: "Gruppe 1", kind: "desk-group", flex: 1, desks: 4 },
  { id: "L2", label: "Gruppe 2", kind: "desk-group", flex: 1, desks: 4 },
  { id: "L3", label: "Gruppe 3", kind: "desk-group", flex: 1, desks: 4 },
  { id: "L4", label: "Gruppe 4", kind: "desk-group", flex: 1, desks: 4 },
];

export const GROUPS_RIGHT = [
  {
    id: "MEET",
    label: "Besprechungsraum",
    kind: "room-timed", // Zeitbasierte Buchung statt ganztägig
    flex: 1.5,
    desks: 1,
  },
  { id: "OFF_S", label: "Büro (klein)", kind: "room-fullday", flex: 0.9, desks: 1 },
  { id: "TRIO", label: "3er-Fläche", kind: "desk-group", flex: 1.1, desks: 3 },
  { id: "OFF_L", label: "Büro (groß)", kind: "room-fullday", flex: 1.3, desks: 1 },
];

// Flache Liste aller einzelnen buchbaren Einheiten (= Zeilen in der DB-Tabelle "resources")
export function buildResourceList() {
  const list = [];
  const addGroup = (group) => {
    for (let i = 1; i <= group.desks; i++) {
      list.push({
        id: group.desks > 1 ? `${group.id}-${i}` : group.id,
        groupId: group.id,
        groupLabel: group.label,
        seat: group.desks > 1 ? i : null,
        label:
          group.desks > 1 ? `${group.label}, Platz ${i}` : group.label,
        kind: group.kind, // 'desk-group' | 'room-fullday' | 'room-timed'
        timeBased: group.kind === "room-timed",
      });
    }
  };
  [...GROUPS_LEFT, ...GROUPS_RIGHT].forEach(addGroup);
  return list;
}

export const RESOURCES = buildResourceList();

export function getResource(id) {
  return RESOURCES.find((r) => r.id === id);
}
