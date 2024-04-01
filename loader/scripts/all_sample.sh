#!/bin/bash

set -e

bpmodules=./data/test_data/sample_human_iba_bpmodules.json
terms=./data/test_data/terms.json
genes=./data/test_data/human_iba_gene_info.json
clean_articles=./downloads/clean_articles2.json
clean_bpmodules=./downloads/human_iba_bpmodules_clean_2.json


python3 -m src.get_articles -a $bpmodules -o $clean_articles

python3 -m src.clean_bpmodules \
-a $bpmodules \
-t $terms \
-art $clean_articles \
-g $genes \
-o $clean_bpmodules

python3 -m src.index_es -a $clean_bpmodules