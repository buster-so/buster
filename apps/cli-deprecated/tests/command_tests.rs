#[test]
fn test_convert_buster_to_dbt_model() {
    let buster_yaml = r#"
version: 2
models:
  - name: test_model
    aliases: ["alias1"]
    entities:
      - name: entity1
        type: Primary
        join_type: inner
        relationship_type: one_to_one
    dimensions:
      - name: dim1
        type: Categorical
        searchable: true
        alias: ["dim_alias"]
        timezone: "UTC"
    measures:
      - name: measure1
        agg: sum
        alias: ["measure_alias"]
"#;

    let dbt_yaml = convert_buster_to_dbt_model(buster_yaml).unwrap();

    // The converted YAML shouldn't contain Buster-specific fields
    assert!(!dbt_yaml.contains("aliases"));
    assert!(!dbt_yaml.contains("join_type"));
    assert!(!dbt_yaml.contains("relationship_type"));
    assert!(!dbt_yaml.contains("searchable"));
    assert!(!dbt_yaml.contains("timezone"));
    assert!(!dbt_yaml.contains("alias"));
}
