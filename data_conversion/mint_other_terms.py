import argparse
from oaklib import get_adapter
from oaklib.implementations.pronto import pronto_implementation as pronto
import json


# Take input of a file with a list of terms. Iterate through them, fetching their label and minting OTHER: IDs to
# build a JSON output file.
parser = argparse.ArgumentParser()
parser.add_argument('-t', '--terms_file')
parser.add_argument('-o', '--ontology_file')


if __name__ == "__main__":
    args = parser.parse_args()

    oak_adapter: pronto.ProntoImplementation = get_adapter(args.ontology_file)

    term_info_list = [
        {
            "term_id": "OTHER:0001",
            "term_label": "other biological process",
        }
    ]
    other_term_count = 2  # Start at 2 because we already have OTHER:0001
    with open(args.terms_file) as tf:
        for t in tf.readlines():
            t = t.rstrip()
            term_n = oak_adapter.node(t)
            term_id = "OTHER:" + str(other_term_count).zfill(4)
            other_term_count += 1
            term_info_list.append({
                "term_id": term_id,
                "term_label": "other {}".format(term_n["lbl"]),
            })

    print(json.dumps(term_info_list, indent=4))

