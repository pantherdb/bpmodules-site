import argparse
import json
import csv
from typing import Dict, List


parser = argparse.ArgumentParser()
parser.add_argument('-m', '--bp_modules_json')
parser.add_argument('-s', '--go_slim_file')
parser.add_argument('-o', '--go_ontology_file', help="TSV of GO term parent(col1)-child(col2) relationships (is_a, part_of only)")
parser.add_argument('-t', '--top_tier_terms_file', help="File of line-separated GO terms to use as top-tier terms")


class OntologyManager:
    def __init__(self, goslim_term_list: str, ontology: str, top_tier_terms_file: str):
        self.goslim_terms = {}
        with open(goslim_term_list) as gtl:
            for l in gtl.readlines():
                self.goslim_terms[l.rstrip()] = []

        # Load top tier terms
        self.top_tier_terms = {}
        self.top_tier_terms_precedence = []
        with open(top_tier_terms_file) as tttf:
            for l in tttf.readlines():
                ttt = l.rstrip()
                self.top_tier_terms[ttt] = {}
                self.top_tier_terms_precedence.append(ttt)
        self.slim_to_top_tier_lkp = {}

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

    def generalize_slim_term(self, goterm: str):
        generalized_slim_terms = self.generalize_term_from_list(self.goslim_terms, goterm)
        if len(generalized_slim_terms) > 1:
            # First, try removing all top_tier_terms from generalized_slim_terms and see if anything is left
            generalized_slim_terms_no_top_tier_terms = generalized_slim_terms.copy()
            for top_tier_term in self.top_tier_terms_precedence:
                if top_tier_term in generalized_slim_terms:
                    generalized_slim_terms_no_top_tier_terms.remove(top_tier_term)
            if len(generalized_slim_terms_no_top_tier_terms) > 0:
                return generalized_slim_terms_no_top_tier_terms
            else:
                # Gotta try something else
                # Use self.top_tier_terms_precedence to determine which single slim term to keep
                for top_tier_term in self.top_tier_terms_precedence:
                    if top_tier_term in generalized_slim_terms:
                        return [top_tier_term]
        return generalized_slim_terms

    def generalize_top_tier_term(self, goterm: str):
        if goterm not in self.slim_to_top_tier_lkp:
            self.slim_to_top_tier_lkp[goterm] = self.generalize_term_from_list(self.top_tier_terms, goterm)
        return self.slim_to_top_tier_lkp[goterm]

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

    ont_manager = OntologyManager(args.go_slim_file, args.go_ontology_file, args.top_tier_terms_file)
    print("goslim_terms", len(ont_manager.goslim_terms))
    print("go_parents", len(ont_manager.go_parents))
    print("top_tier_terms", len(ont_manager.top_tier_terms))

    # Load BP modules
    with open(args.bp_modules_json) as bmj:
        bp_modules = json.load(bmj)
    print(len(bp_modules))
    # Iterate through and put module in go_slim_terms key if key is_ancestor_of module_term
    module_leftovers = []
    for m in bp_modules:
        module_term = m["module_term"]
        slim_terms = ont_manager.generalize_slim_term(module_term)
        if slim_terms:
            if len(slim_terms) > 1:
                print("\t".join(["Multiple slim terms for", module_term] + slim_terms))
            for slim_term in slim_terms:
                ont_manager.goslim_terms[slim_term].append(m)
        else:
            module_leftovers.append(m)

    # Iterate through go_slim_terms and put in top_tier_terms key if top_tier_term is_ancestor_of slim_term
    slim_term_leftovers = {}
    for slim_term, st_modules in ont_manager.goslim_terms.items():
        is_descendant_of_top_tier_term = False
        top_tier_terms = ont_manager.generalize_top_tier_term(slim_term)
        if top_tier_terms:
            for top_tier_term in top_tier_terms:
                if slim_term not in ont_manager.top_tier_terms[top_tier_term]:
                    ont_manager.top_tier_terms[top_tier_term][slim_term] = []
                ont_manager.top_tier_terms[top_tier_term][slim_term].append(st_modules)
        else:
            slim_term_leftovers[slim_term] = st_modules

    ont_manager.top_tier_terms["Other"] = slim_term_leftovers
    print(len(ont_manager.top_tier_terms["Other"]))
    distinct_leftover_modules = []
    for slim_term, modules in slim_term_leftovers.items():
        for m in modules:
            if m not in distinct_leftover_modules:
                distinct_leftover_modules.append(m)
    print("Distinct leftover modules:", len(distinct_leftover_modules))

    # Count total number of modules in the top tier terms dict
    total_modules = 0
    distinct_modules = []
    for top_tier_term, slim_terms in ont_manager.top_tier_terms.items():
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