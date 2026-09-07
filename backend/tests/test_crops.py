import pytest

from app.simulation import crops


def test_all_required_crops_exist():
    keys = crops.list_crop_keys()
    for required in ("lettuce", "tomato", "radish"):
        assert required in keys


def test_get_crop_is_case_insensitive():
    assert crops.get_crop("Tomato").key == "tomato"


def test_unknown_crop_raises():
    with pytest.raises(KeyError):
        crops.get_crop("kale")


def test_derived_values_are_positive():
    for crop in crops.list_crops():
        assert crop.total_biomass_g >= crop.harvest_biomass_g
        assert crop.baseline_growth_rate_g_per_day > 0
        assert crop.to_dict()["key"] == crop.key
