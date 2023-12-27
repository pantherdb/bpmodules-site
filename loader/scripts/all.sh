#!/bin/bash

set -e


terms_fp='./downloads/input/go_term_info.json'
genes_fp='./downloads/input/bp_module_gene_info.json'
term_dispositions_fp='./downloads/input/term_dispositions.json'
bpmodules_fp='./downloads/input/ibd_modules_organized.json'
clean_bpmodules_fp='./downloads/input/clean_bpmodules.json'


python3 -m src.clean_bpmodules \
-bp $bpmodules_fp \
-t $terms_fp \
-td $term_dispositions_fp \
-g $genes_fp \
-o $clean_bpmodules_fp



python3 -m src.index_es -bp $clean_bpmodules_fp