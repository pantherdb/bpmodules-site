import argparse
import json
from oaklib import get_adapter
from oaklib.implementations.pronto import pronto_implementation as pronto


parser = argparse.ArgumentParser()
parser.add_argument('-o', '--ontology_file')
parser.add_argument('-l', '--level_one_terms_file')
parser.add_argument('-b', '--bp_modules_json')
parser.add_argument('-g', '--out_goterm_file')
parser.add_argument('-d', '--out_dispositions_file')


if __name__ == "__main__":
    args = parser.parse_args()

    oak_adapter: pronto.ProntoImplementation = get_adapter(args.ontology_file)

    terms = []
    # Need to iterate through all terms in BP module DS
    with open(args.bp_modules_json) as bpm:
        bp_modules = json.load(bpm)
    used_terms = set()
    # Drill down through multiple levels grabbing the full set of used terms
    for top_level in bp_modules:
        used_terms.add(top_level["id"])
        for category in top_level["categories"]:
            used_terms.add(category["id"])
            for module in category["modules"]:
                used_terms.add(module["module_term"])
                for node in module["nodes"]:
                    [used_terms.add(n) for n in node["terms"]]

    term_data = []
    for term_id in used_terms:
        term_n = oak_adapter.node(term_id)
        if term_id.startswith("OTHER:"):
            # Ignore, will be added later
            continue
        else:
            term_label = term_n["lbl"]
        term_dict = {
            "term_id": term_id,
            "term_label": term_label,
        }
        term_data.append(term_dict)
    print("Num GO terms:", len(term_data))

    # Add OTHER: terms from JSON file
    with open(args.level_one_terms_file) as l1tf:
        other_terms = json.load(l1tf)
    print("Num OTHER: terms:", len(other_terms))
    term_data.extend(other_terms)
    print("Num all terms:", len(term_data))

    term_dispositions = []
    # If logical definition for term, extract it
    # Ex: "negative regulation of mitochondrial RNA catabolic process" has logical definition:
    #  negatively regulates some mitochondrial RNA catabolic process
    # Fetch "mitochondrial RNA catabolic process" term and "negatively regulates" relation
    for edge in oak_adapter.edges():
        if edge.pred in ["RO:0002212", "RO:0002213"] and edge.sub in used_terms:
            td = {
                "term_id": edge.sub,
                "disposition": "negative" if edge.pred == "RO:0002212" else "positive",
                "affected_term_id": edge.obj,
            }
            term_dispositions.append(td)
    print("Num dispositions:", len(term_dispositions))

    with open(args.out_goterm_file, "w+") as ogf:
        json.dump(term_data, ogf, indent=4)

    with open(args.out_dispositions_file, "w+") as odf:
        json.dump(term_dispositions, odf, indent=4)
