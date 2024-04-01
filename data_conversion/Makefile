SHELL := /bin/bash

%/all: %/go_term_info.json
	echo "Done"

.PRECIOUS: %/resources/go.json
%/resources/go.json:
	mkdir -p $*/resources
	wget https://release.geneontology.org/2022-12-04/ontology/go.json -O $@

.PRECIOUS: %/resources/ibd_clusters_genes_ibas.json
%/resources/ibd_clusters_genes_ibas.json:
	# References 2022-12-04 GO ontology
	mkdir -p $*/resources
	wget http://data.pantherdb.org/ftp/downloads/pango/bp_modules/ibd_clusters_genes_ibas.json -O $@

.PRECIOUS: %/resources/ibd_clusters_genes_ibas_addtl.json
%/resources/ibd_clusters_genes_ibas_addtl.json:
	# Even more modules. References 2024-01-17 GO ontology
	mkdir -p $*/resources
	wget http://data.pantherdb.org/ftp/downloads/pango/bp_modules/ibd_clusters_genes_ibas_addtl.json -O $@

.PRECIOUS: %/other_terms.json
%/other_terms.json: %/resources/go.json
	mkdir -p $*/
	python3 mint_other_terms.py -t resources/level_one_terms.txt -o $*/resources/go.json > $@

.PRECIOUS: %/go_term_info.json
%/go_term_info.json: %/other_terms.json %/ibd_modules_organized.json %/resources/go.json
	python3 go_term_lkp_json.py -l $< -o $*/resources/go.json -b $*/ibd_modules_organized.json -g $@ -d $*/term_dispositions.json

.PRECIOUS: %/ibd_modules_organized.json
%/ibd_modules_organized.json: %/other_terms.json %/resources/ibd_clusters_genes_ibas.json %/resources/ibd_clusters_genes_ibas_addtl.json
	python3 organize_bp_modules_from_slim.py -m $*/resources/ibd_clusters_genes_ibas.json $*/resources/ibd_clusters_genes_ibas_addtl.json -s resources/go_slim_terms.txt -t resources/level_one_terms.txt -p $*/other_terms.json -o resources/goparentchild_w_regulates_2022-12-04.tsv -l resources/go_term_labels_2022-12-04.tsv -j $@

tests:
	pytest test.py