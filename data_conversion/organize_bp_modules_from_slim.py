import argparse
import json
import csv
from typing import Dict, List


parser = argparse.ArgumentParser()
parser.add_argument('-m', '--bp_modules_json')
parser.add_argument('-s', '--go_slim_file')
parser.add_argument('-o', '--go_ontology_file', help="TSV of GO term parent(col1)-child(col2) relationships (is_a, part_of only)")
parser.add_argument('-t', '--level_one_terms_file', help="File of line-separated GO terms to use as level one terms")
parser.add_argument('-p', '--other_ont_json', help="JSON of OTHER: terms to use for level one terms")
parser.add_argument('-l', '--go_term_labels_file')
parser.add_argument('-j', '--json_output_file')


class OntologyManager:
    def __init__(self, goslim_term_list: str, ontology: str, level_one_terms_file: str, other_terms_file: str):
        self.goslim_terms = {}
        with open(goslim_term_list) as gtl:
            for l in gtl.readlines():
                self.goslim_terms[l.rstrip()] = []

        # Load top tier terms
        self.level_one_terms = {}
        self.level_one_terms_precedence = []
        with open(level_one_terms_file) as l1tf:
            for l in l1tf.readlines():
                ttt = l.rstrip()
                self.level_one_terms[ttt] = {}
                self.level_one_terms_precedence.append(ttt)
        self.slim_to_level_one_lkp = {}

        self.other_terms_lkp_by_label = {}
        with open(other_terms_file) as otf:
            other_terms = json.load(otf)
            for ot in other_terms:
                self.other_terms_lkp_by_label[ot["term_label"]] = ot["term_id"]

        self.go_parents = {}
        with open(ontology) as of:
            reader = csv.reader(of, delimiter="\t")
            for r in reader:
                parent, child = r
                if child not in self.go_parents:
                    self.go_parents[child] = set()
                self.go_parents[child].add(parent)

    def is_ancestor_of(self, term_a, term_b):
        # Determine whether term_a is_ancestor_of term_b
        if term_b in self.go_parents:
            for parent in self.go_parents[term_b]:
                if parent == term_a or self.is_ancestor_of(term_a, parent):
                    return True

    def remove_redundant_terms(self, term_list: List):
        # Remove redundant terms from a list of terms
        nonredundant_terms = []
        for t1 in term_list:
            t1_is_redundant = False
            for t2 in term_list:
                if self.is_ancestor_of(t1, t2):
                    t1_is_redundant = True
                    break
            if not t1_is_redundant:
                nonredundant_terms.append(t1)
        return nonredundant_terms

    def generalize_term_from_list(self, term_list, goterm: str):
        inferred_terms = self.infer_terms_from_list(term_list, goterm)
        return self.remove_redundant_terms(inferred_terms)

    def infer_terms_from_list(self, term_list, goterm: str, new_terms: List = None):
        # Roll up annotated term to goslim_generic
        if new_terms is None:
            new_terms = []
        if goterm not in term_list:
            if goterm not in self.go_parents:
                return []
            for parent_term in self.go_parents[goterm]:
                for new_term in self.infer_terms_from_list(term_list, parent_term, new_terms):
                    if new_term not in new_terms:
                        new_terms.append(new_term)
            return new_terms
        else:
            return [goterm]

    def level_one_term_precedence_index_for_term(self, goterm: str):
        level_one_terms = self.generalize_level_one_term(goterm)
        if level_one_terms:
            return self.level_one_terms_precedence.index(level_one_terms[0])
        return 10000  # Some huge number so it sorts last

    def generalize_slim_term(self, goterm: str):
        generalized_slim_terms = self.generalize_term_from_list(self.goslim_terms, goterm)
        if len(generalized_slim_terms) > 1:
            # First, try removing all level_one_terms from generalized_slim_terms and see if anything is left
            generalized_slim_terms_no_level_one_terms = generalized_slim_terms.copy()
            for level_one_term in self.level_one_terms_precedence:
                if level_one_term in generalized_slim_terms:
                    generalized_slim_terms_no_level_one_terms.remove(level_one_term)
            if len(generalized_slim_terms_no_level_one_terms) == 1:
                return generalized_slim_terms_no_level_one_terms
            elif len(generalized_slim_terms_no_level_one_terms) > 1:
                # If still multiples, order by their top tier term precedence and return first one
                sorted_terms = sorted(generalized_slim_terms_no_level_one_terms, key=lambda x: self.level_one_term_precedence_index_for_term(x))
                return [sorted_terms[0]]
            else:
                # Gotta try something else
                # Use self.level_one_terms_precedence to determine which single slim term to keep
                for level_one_term in self.level_one_terms_precedence:
                    if level_one_term in generalized_slim_terms:
                        return [level_one_term]
        return generalized_slim_terms

    def generalize_level_one_term(self, goterm: str):
        if goterm not in self.slim_to_level_one_lkp:
            generalized_level_one_terms = self.generalize_term_from_list(self.level_one_terms, goterm)
            if len(generalized_level_one_terms) > 1:
                # If still multiples, order by their top tier term precedence and return first one
                sorted_terms = sorted(generalized_level_one_terms, key=lambda x: self.level_one_term_precedence_index_for_term(x))
                generalized_level_one_term = [sorted_terms[0]]
            else:
                generalized_level_one_term = generalized_level_one_terms
            self.slim_to_level_one_lkp[goterm] = generalized_level_one_term
        return self.slim_to_level_one_lkp[goterm]

    def get_ancestors_in_list(self, term_list, term, hops: int = 0):
        # Returns None if no ancestor is in go_slim_terms
        found_slim_terms = set()
        if term in self.go_parents:
            for p in self.go_parents[term]:
                hops += 1
                if p in term_list:
                    found_slim_terms.add((p, hops))
                else:
                    found_slim_terms.update(self.get_ancestors_in_list(term_list, p, hops))
        return found_slim_terms


if __name__ == "__main__":
    args = parser.parse_args()

    ont_manager = OntologyManager(args.go_slim_file, args.go_ontology_file, args.level_one_terms_file, args.other_ont_json)
    print("goslim_terms", len(ont_manager.goslim_terms))
    print("go_parents", len(ont_manager.go_parents))
    print("level_one_terms", len(ont_manager.level_one_terms))

    term_labels = {}
    with open(args.go_term_labels_file) as gtlf:
        reader = csv.reader(gtlf, delimiter="\t")
        for r in reader:
            goterm, label = r[0], r[1]
            term_labels[goterm] = label

    # Load BP modules
    with open(args.bp_modules_json) as bmj:
        bp_modules = json.load(bmj)
    print(len(bp_modules))
    # Iterate through and put module in go_slim_terms key if key is_ancestor_of module_term
    module_leftovers = {}
    modules_with_too_few_leaf_genes = []
    for m in bp_modules:
        module_term = m["module_term"]
        # Look for nodes with empty leaf_genes
        nodes_with_empty_leaf_genes = [node for node in m["nodes"] if not node["leaf_genes"]]
        nodes_w_leaf_genes_count = len(m["nodes"]) - len(nodes_with_empty_leaf_genes)
        if nodes_w_leaf_genes_count <= 1:
            modules_with_too_few_leaf_genes.append(m)
            if nodes_w_leaf_genes_count == 0:
                # Drop this entire BP module from the output
                continue
        slim_terms = ont_manager.generalize_slim_term(module_term)
        if slim_terms:
            if len(slim_terms) > 1:
                terms_with_labels = []
                for mt in [module_term] + slim_terms:
                    term_label = term_labels.get(mt, "")
                    term_and_label = mt + " " + term_label
                    terms_with_labels.append(term_and_label)
                print("\t".join(["Multiple slim terms for"] + terms_with_labels))
            for slim_term in slim_terms:
                ont_manager.goslim_terms[slim_term].append(m)
        else:
            if module_term not in module_leftovers:
                module_leftovers[module_term] = []
            module_leftovers[module_term].append(m)

    print("\t".join(["module_term", "num_nodes", "num_nodes_w_leaf_genes"]))
    for m in modules_with_too_few_leaf_genes:
        # Print out module_term, num of nodes, num of nodes w/ leaf_genes
        print("\t".join([m["module_term"], term_labels.get(m["module_term"], ""), str(len(m["nodes"])), str(len([node for node in m["nodes"] if node["leaf_genes"]]))]))

    # Iterate through go_slim_terms and put in level_one_terms key if level_one_term is_ancestor_of slim_term
    slim_term_leftovers = {}
    for slim_term, st_modules in ont_manager.goslim_terms.items():
        is_descendant_of_level_one_term = False
        level_one_terms = ont_manager.generalize_level_one_term(slim_term)
        if level_one_terms:
            for level_one_term in level_one_terms:
                # if slim_term not in ont_manager.level_one_terms[level_one_term]:
                #     ont_manager.level_one_terms[level_one_term][slim_term] = []
                ont_manager.level_one_terms[level_one_term][slim_term] = st_modules
        else:
            slim_term_leftovers[slim_term] = st_modules

    other_bp_term = ont_manager.other_terms_lkp_by_label["other biological process"]
    ont_manager.level_one_terms[other_bp_term] = module_leftovers
    print(len(ont_manager.level_one_terms[other_bp_term]))
    distinct_leftover_modules = []
    for slim_term, modules in slim_term_leftovers.items():
        for m in modules:
            if m not in distinct_leftover_modules:
                distinct_leftover_modules.append(m)
    print("Distinct leftover modules:", len(distinct_leftover_modules))

    # Count total number of modules in the top tier terms dict
    total_modules = 0
    distinct_modules = []
    for level_one_term, slim_terms in ont_manager.level_one_terms.items():
        for slim_term, modules in slim_terms.items():
            total_modules += len(modules)
            for m in modules:
                if m not in distinct_modules:
                    distinct_modules.append(m)
    print("Total final modules:", total_modules)
    print("Distinct final modules:", len(distinct_modules))

    # Count number of modules in intersection of distinct_modules and distinct_leftover_modules
    module_intersection = []
    for m in distinct_modules:
        if m in distinct_leftover_modules:
            module_intersection.append(m)
    for m in distinct_leftover_modules:
        if m in distinct_modules and m not in module_intersection:
            module_intersection.append(m)
    print("Intersection:", len(module_intersection))

    if args.json_output_file:
        json_output_ds = []
        for level_one_term, slim_terms in ont_manager.level_one_terms.items():
            top_term_ds = {
                "id": level_one_term,
                "categories": []
            }
            for st in slim_terms:
                if st == level_one_term:
                    term_lbl = "other {}".format(term_labels[st].replace("_", " "))
                    term_id = ont_manager.other_terms_lkp_by_label[term_lbl]
                else:
                    term_id = st
                slim_term_ds = {
                    "id": term_id,
                    "modules": []
                }
                for m in slim_terms[st]:
                    slim_term_ds["modules"].append(m)
                top_term_ds["categories"].append(slim_term_ds)
            json_output_ds.append(top_term_ds)
        # Write out json
        with open(args.json_output_file, "w") as jof:
            json.dump(json_output_ds, jof, indent=4)
