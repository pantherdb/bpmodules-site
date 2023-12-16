SHELL := /bin/bash

%/all: %/go_term_info.json
	echo "Done"

.PRECIOUS: %/resources/go.obo
%/resources/go.obo:
	mkdir -p $*/resources
	wget http://release.geneontology.org/2022-03-22/ontology/go.obo -O $@

.PRECIOUS: %/bin/robot
%/bin/robot:
	mkdir -p $*/bin
	wget https://github.com/ontodev/robot/releases/download/v1.7.0/robot.jar -O $*/bin/robot.jar
	wget https://github.com/ontodev/robot/raw/master/bin/robot -O $@
	chmod 744 $@

.PRECIOUS: %/level_one_terms.json
%/level_one_terms.json:
	python3 mint_other_terms.py -t resources/level_one_terms.txt -o /Users/ebertdu/panther/fullgo_paint_update/2022-12-06_fullgo/go.json > $@

.PRECIOUS: %/go_term_info.json
%/go_term_info.json: %/level_one_terms.json %/ibd_modules_organized.json
	python3 go_term_lkp_json.py -l $< -o /Users/ebertdu/panther/fullgo_paint_update/2022-12-06_fullgo/go.json -b $*/ibd_modules_organized.json -g $@ -d $*/term_dispositions.json

.PRECIOUS: %/ibd_modules_organized.json
%/ibd_modules_organized.json: %/level_one_terms.json
	python3 organize_bp_modules_from_slim.py -m resources/test/ibd_clusters_genes_ibas.json -s resources/go_slim_terms.txt -t resources/level_one_terms.txt -p $*/level_one_terms.json -o /Users/ebertdu/panther/fullgo_paint_update/2022-12-06_fullgo/goparentchild_w_regulates.tsv -l /Users/ebertdu/panther/fullgo_paint_update/2022-12-06_fullgo/inputforGOClassification.tsv -j $@

tests:
	pytest test.py