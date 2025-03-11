// src/components/attendance/dashboard/chartExplanations.ts
// Diese Datei enthält alle Erklärungstexte für die verschiedenen Graphen

export const CHART_EXPLANATIONS = {
  timeSeriesChart: {
    title: "Zeitlicher Verlauf",
    content: 
      "Zeigt die Entwicklung der ausgewählten Metriken (Verspätungen, Fehltage) über den gewählten Zeitraum. " +
      "Die Daten können entweder wöchentlich oder monatlich gruppiert werden.\n\n" +
      "Die optionalen Durchschnittslinien bieten Vergleichswerte:\n\n" +
      "• '⌀ Klasse': Durchschnitt aller Klassen im Report. Beispiel: Wenn Klasse 9A 5 Verspätungen pro Woche hat, während der Durchschnitt aller Klassen bei 3 liegt, sehen Sie die Abweichung.\n\n" +
      "• '⌀ Schüler': Durchschnitt aller Schüler im Report. Beispiel: Wenn Max 4 Fehltage im November hat, aber der Durchschnitt aller Schüler bei 2 liegt, ist dies sofort erkennbar.\n\n" +
      "Diese Vergleichsdurchschnitte werden aus allen verfügbaren Daten im Report berechnet, unabhängig von der aktuellen Filterauswahl."
  },
  
  weekdayAnalysis: {
    title: "Wochentagsanalyse",
    content: 
      "Stellt die Verteilung von Verspätungen und Fehltagen nach Wochentagen dar. Dabei werden immer alle Daten aus dem Report herangezogen, also die maximal erfassten Fehlzeiten, unabhängig von der Zeitraumsauswahl.\n\n" +
      "Kritische Tage mit besonders hohen Werten werden hervorgehoben.\n\n" +
      "Zeigt an, an welchen Wochentagen Verspätungen und Fehltage besonders häufig auftreten."
  },
  
  movingAverage: {
    title: "Gleitender Durchschnitt",
    content: 
      "Berechnet für jeden Zeitpunkt den Durchschnitt aus mehreren aufeinanderfolgenden Perioden, " +
      "basierend ausschließlich auf den Daten des ausgewählten Schülers oder der ausgewählten Klasse.\n\n" +
      "Beispielberechnung bei Periode 3:\n\n" +
      "• November: 5 (tatsächlicher Wert oder Durchschnitt der letzten 3 Monate)\n\n" +
      "• Dezember: 4.7 (Durchschnitt von Okt, Nov, Dez)\n\n" +
      "• Januar: 4.7 (Durchschnitt von Nov, Dez, Jan)\n\n" +
      "• Februar: 3.7 (Durchschnitt von Dez, Jan, Feb)\n\n" +
      "Dies glättet kurzfristige Schwankungen und macht langfristige Trends sichtbar.\n\n" +
      "Wichtig: Es werden immer nur individuelle Daten der ausgewählten Person oder Klasse verwendet, " +
      "niemals schul- oder klassenweite Durchschnittswerte. Ausreißer (ungewöhnlich hohe oder niedrige Werte) werden markiert."
  },
  
  regression: {
    title: "Regressionsanalyse",
    content: 
      "Erkennt und visualisiert den langfristigen Trend in den Daten durch eine Regressionslinie.\n\n" +
      "Berechnet wird die beste Annäherung an alle Datenpunkte.\n\n" +
      "Die Steigung der Linie zeigt, ob die Werte tendenziell zunehmen oder abnehmen.\n\n" +
      "R² (Bestimmtheitsmaß) gibt an, wie zuverlässig der erkannte Trend ist (0 bis 1).\n\n" +
      "Ausreißer können optisch markiert und für die Berechnung ausgeschlossen werden.\n\n" +
      "Eine Prognose für den nächsten Zeitraum wird angezeigt."
  }
};