exports.defineTags = function(dictionary) {
	dictionary.defineTag("cpu", {
		mustHaveValue:true,
		onTagged: function(doclet, tag) {
			doclet.cpu = tag.value;
		},
	})
}

var calcColor = function(s) {
	if (s.includes("HIGH")) return "#FF9999";
	if (s.includes("AVERAGE")) return "#FFFF99";
	if (s.includes("LOW")) return "#999999";
	return "#FFFFFF";
}

exports.handlers = {
	newDoclet: function(e) {
		if (e.doclet.cpu) {
			e.doclet.description += "\n\n<span style=\"background-color:" + calcColor(e.doclet.cpu) + "\">CPU: " + e.doclet.cpu + "</span>";
		}
	}
}