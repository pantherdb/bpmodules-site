import argparse
import json
from os import path as ospath
import time
import numpy as np
import pandas as pd
from src.config.base import file_path
from src.utils import get_pd_row, get_pd_row_key, write_to_json

DISPLAYED_COLUMNS =['section_id',
                'section_label',
                'category_id', 
                'category_label',                     
                'module_label',
                'module_id', 
                'disposition_sources',
                'disposition',
                'disposition_target_id',
                'node_id', 
                'node_label', 
                'terms', 
                'leaf_genes',
                'category_count',
                'module_count',
                'node_count']

def main():
    parser = parse_arguments()
    terms_df = get_terms_map(parser.terms_fp)
    term_dispositions_df = get_term_dispositions_map(parser.term_dispositions_fp)
    genes_df = get_genes_map(parser.genes_fp)
    bpmodules_df = get_bpmodules(parser.bpmodules_fp, terms_df, genes_df, term_dispositions_df)
    bpmodule_json = bpmodules_df.to_json(orient="records", default_handler=None)
    json_str = json.loads(bpmodule_json)

    write_to_json(json_str, ospath.join('.', parser.clean_bpmodules_fp), indent=2)


def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('-bp', dest='bpmodules_fp', required=True,
                        type=file_path, help='bpmodules Json')
    parser.add_argument('-t', dest='terms_fp', required=True,
                        type=file_path, help='Terms Json')
    parser.add_argument('-td', dest='term_dispositions_fp', required=True,
                        type=file_path, help='Term Dispositions Json')
    parser.add_argument('-g', dest='genes_fp', required=True,
                        type=file_path, help='Genes Json')
    parser.add_argument('-o', dest='clean_bpmodules_fp', required=True,
                         help='Output of Clean bpmodule')

    return parser.parse_args()




# Terms
def get_terms_map(terms_fp):
    terms_df = pd.read_json(terms_fp)
    terms_df = terms_df.set_index('term_id', drop=False)
    terms_df = terms_df.rename(columns={'term_id': 'id', 'term_label': 'label'})
    return terms_df

#Article
def get_term_dispositions_map(term_dispositions_fp):
    term_dispositions_df = pd.read_json(term_dispositions_fp)
    term_dispositions_df = term_dispositions_df.set_index('term_id', drop=False)
    term_dispositions_df = term_dispositions_df.rename(columns={'term_id': 'id', 'affected_term_id': 'disposition_target_id'})

    return  term_dispositions_df


# Gene
def get_genes_map(genes_fp):
    genes_df = pd.read_json(genes_fp, dtype={'taxon_id':str})
    genes_df = genes_df.set_index('gene', drop=False)
    return genes_df

def find_disposition_sources(module_id, df):
    matching_terms = df[df['disposition_target_id'] == module_id]
    sources = [{'term_id': row['id'], 'disposition': row['disposition']} for index, row in matching_terms.iterrows()]
    return sources


def get_bpmodules(bpmodules_fp, terms_df, genes_df, term_dispositions_df):  
    
    bpmodules_df = pd.read_json(bpmodules_fp)

    flattened_data = []

    for section in bpmodules_df.itertuples(index=False):
        section_id = section.id
        category_count= len(section.categories)
        for category in section.categories:
            category_id = category['id']
            module_count = len(category['modules'])
            
            for module in category['modules']:
            
                module_id = module['module_term']
                disposition_sources = find_disposition_sources(module_id, term_dispositions_df)

                node_count = len(module.get("nodes", []))
                
                for node in module.get('nodes', []):
                    node_id = node.get('ptn_id')
                    node_label = node.get('label')
                    
                    term_info = [{'term_id': term, 'term_label': terms_df.loc[term, 'label']} for term in node.get('terms', []) if term in terms_df.index]
                    gene_info = [genes_df.loc[gene].to_dict() for gene in node.get('leaf_genes', []) if gene in genes_df.index]

                    flattened_data.append({
                        'section_id': section_id,
                        'category_id': category_id,
                        'module_id': module_id,
                        'disposition_sources': disposition_sources,
                        'node_id': node_id,
                        'node_label': node_label,
                        'terms': term_info,
                        'leaf_genes': gene_info,
                        'category_count': category_count,
                        'module_count': module_count,
                        'node_count': node_count
                    })

            flat_df = pd.DataFrame(flattened_data)

            flat_df = flat_df.merge(terms_df, left_on='section_id', right_on='id', how='left', suffixes=('', '_section')).rename(columns={'label': 'section_label'})
            flat_df = flat_df.merge(terms_df, left_on='category_id', right_on='id', how='left', suffixes=('', '_category')).rename(columns={'label': 'category_label'})
            flat_df = flat_df.merge(terms_df, left_on='module_id', right_on='id', how='left', suffixes=('', '_module_term')).rename(columns={'label': 'module_label'})
            flat_df = flat_df.merge(term_dispositions_df, left_on='module_id', right_on='id', how='left')


            final_df = flat_df[DISPLAYED_COLUMNS]
            
            return final_df


if __name__ == "__main__":
    main()
