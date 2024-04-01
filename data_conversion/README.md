# Data conversion
Organize BP module lists into multi-tier GO slim term hierarchy into JSON format for loading to elasticsearch.
Module hierarchy organization:
* Level one terms - Top-tier terms listed in `level_one_terms.txt`
* GO slim category - More specific terms listed in `go_slim_terms.txt`
* Module term - BP module terms
* Annotated term - Actual term annotated in IBD under the more general module term
### Example hierarchy
* level one: GO:0003008 (system process)
  * slim category: GO:0003013 (circulatory system process)
    * module term: GO:0060047 (heart contraction)
      * annotated term: GO:0060048 (cardiac muscle contraction)
## Run
Specify a destination `{target}` folder and run from `data_conversion`:
```
make {target}/all
```
## Other Terms
Produce JSON file `other_terms.json` containing dynamically-minted `OTHER:00XX` terms for the top-level GO slim terms. These `OTHER` categories will catch any module that is a descendant of a level one term but not of any go_slim_terms.
This `mint_other_terms.py` script simply prepends "other " to the level one term name. Ex: "homeostatic process" -> "other homeostatic process".

## Modules organized
Produce JSON file `ibd_modules_organized.json` containing BP modules organized under their appropriate slim term.
### Run organize_bp_modules_from_slim.py
```
python3 organize_bp_modules_from_slim.py \
-m ibd_clusters_genes_ibas.json ibd_clusters_genes_ibas_addtl.json \
-s go_slim_terms.txt \
-t level_one_terms.txt \
-p other_terms.json \
-o goparentchild_w_regulates.tsv \
-l go_term_labels.tsv \
-j ibd_modules_organized.json
```
```
  -m [BP_MODULES_JSON ...], --bp_modules_json [BP_MODULES_JSON ...]
                        Flat list JSON of BP modules. Multiple args allowed.
  -s GO_SLIM_FILE, --go_slim_file GO_SLIM_FILE
  -o GO_ONTOLOGY_FILE, --go_ontology_file GO_ONTOLOGY_FILE
                        TSV of GO term parent(col1)-child(col2) relationships (is_a,
                        part_of, regulates)
  -t LEVEL_ONE_TERMS_FILE, --level_one_terms_file LEVEL_ONE_TERMS_FILE
                        File of line-separated GO terms to use as level one terms
  -p OTHER_ONT_JSON, --other_ont_json OTHER_ONT_JSON
                        JSON of OTHER: terms to use for level one terms
  -l GO_TERM_LABELS_FILE, --go_term_labels_file GO_TERM_LABELS_FILE
  -j JSON_OUTPUT_FILE, --json_output_file JSON_OUTPUT_FILE
```
## Ontology
Produce JSON file `go_term_info.json`. To be generated after `ibd_modules_organized.json` is created.
```
python3 go_term_lkp_json.py \
-l other_terms.json \
-o go.json \
-b ibd_modules_organized.json \
-g go_term_info.json \
-d term_dispositions.json
```
## Gene list
Produce JSON file `human_iba_gene_info.json` containing distinct gene info by adding the `-g, --gene_info_only` option.
```
python3 iba_exp_refs_to_json.py \
-f gene_association.paint_human.gaf \
-o goparentchild.tsv \
-s goslim_generic.tsv \
-a go_aspects.tsv -g > human_iba_gene_info.json
```
## Dependencies
[oaklib](https://incatools.github.io/ontology-access-kit/introduction.html)
