from organize_bp_modules_from_slim import OntologyManager

goslim_term_file = "resources/go_slim_terms.txt"
ontology_file = "/Users/ebertdu/panther/fullgo_paint_update/2022-12-06_fullgo/goparentchild_isaonly.tsv"
level_one_terms_file = "resources/top_tier_terms.txt"
ont_manager = OntologyManager(goslim_term_file, ontology_file, level_one_terms_file)


def test_slim_term_generalization():
    # GO:0031048 regulatory ncRNA-mediated gene silencing
    # GO:0031048 is descendant of GO:0031047, GO:0071840, GO:0006325, GO:0009987
    # GO:0031048 should only be in GO:0031047 bucket
    # assert ont_manager.generalize_slim_term("GO:0031048") == "GO:0031047"

    # GO:0006259 is descendant of both GO:0008152, GO:0009987

    # GO:0042063 gliogenesis is a descendant of both anatomical structure development (GO:0048856)
    #  and cell differentiation (GO:0030154)
    # GO:0042063 should only be in GO:0030154 bucket
    assert ont_manager.generalize_slim_term("GO:0042063") == ["GO:0030154"]

    # GO:0071621 granulocyte chemotaxis is a descendant of both immune system process (GO:0002376)
    #  and cellular process (GO:0009987)
    # GO:0071621 should only be in GO:0002376 bucket
    assert ont_manager.generalize_slim_term("GO:0071621") == ["GO:0002376"]

    # GO:0000422 autophagy of mitochondrion is descendant of both autophagy (GO:0006914)
    #  and mitochondrion organization (GO:0007005)
    # GO:0000422 should only be in GO:0006914 bucket
    assert ont_manager.generalize_slim_term("GO:0000422") == ["GO:0006914"]


def test_top_tier_term_generalization():
    # GO:0007018 microtubule-based movement
    assert ont_manager.generalize_top_tier_term("GO:0007018") == ["GO:0009987"]
