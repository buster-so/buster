use crate::errors::SqlAnalyzerError;
use crate::types::{QuerySummary, TableInfo, JoinInfo, CteSummary};
use sqlparser::ast::{
    Visit, Visitor, TableFactor, Join, Expr, Query, Cte, ObjectName,
    SelectItem, Statement, JoinConstraint, JoinOperator, SetExpr, TableAlias, Ident
};
use sqlparser::dialect::GenericDialect;
use sqlparser::parser::Parser;
use std::collections::{HashMap, HashSet};
use std::ops::ControlFlow;
use anyhow::Result;

pub mod semantic;

pub(crate) fn analyze_sql(sql: &str) -> Result<QuerySummary, SqlAnalyzerError> {
    let ast = Parser::parse_sql(&GenericDialect, sql)?;
    let mut analyzer = QueryAnalyzer::new();

    for stmt in ast {
        if let Statement::Query(query) = stmt {
            analyzer.process_query(&query)?;
        }
    }

    analyzer.into_summary()
}

#[derive(Debug)]
struct QueryAnalyzer {
    tables: HashMap<String, TableInfo>,
    joins: HashSet<JoinInfo>,
    cte_aliases: Vec<HashSet<String>>,
    scope_stack: Vec<String>,
    table_aliases: HashMap<String, String>,
    column_mappings: HashMap<String, HashMap<String, (String, String)>>,
    current_from_relation_identifier: Option<String>,
    vague_columns: Vec<String>,
    vague_tables: Vec<String>,
    ctes: Vec<CteSummary>,
}

impl QueryAnalyzer {
    fn new() -> Self {
        QueryAnalyzer {
            tables: HashMap::new(),
            joins: HashSet::new(),
            cte_aliases: vec![HashSet::new()],
            ctes: Vec::new(),
            vague_columns: Vec::new(),
            vague_tables: Vec::new(),
            column_mappings: HashMap::new(),
            scope_stack: Vec::new(),
            current_from_relation_identifier: None,
            table_aliases: HashMap::new(),
        }
    }

    fn get_factor_identifier_and_register_alias(&mut self, factor: &TableFactor) -> Option<String> {
        match factor {
            TableFactor::Table { name, alias, .. } => {
                let first_part = name.0.first().map(|i| i.value.clone()).unwrap_or_default();
                if name.0.len() == 1 && self.is_cte(&first_part) {
                    let cte_name = first_part;
                    if let Some(a) = alias {
                        let alias_name = a.name.value.clone();
                        self.table_aliases.insert(alias_name.clone(), cte_name.clone());
                        Some(alias_name)
                    } else {
                        self.table_aliases.entry(cte_name.clone()).or_insert_with(|| cte_name.clone());
                        Some(cte_name)
                    }
                } else {
                    let base_table_identifier = self.get_table_name(name);
                    if let Some(a) = alias {
                        let alias_name = a.name.value.clone();
                        self.table_aliases.insert(alias_name.clone(), base_table_identifier.clone());
                        Some(alias_name)
                    } else {
                        self.table_aliases.entry(base_table_identifier.clone()).or_insert_with(|| base_table_identifier.clone());
                        Some(base_table_identifier)
                    }
                }
            },
            TableFactor::Derived { alias, .. } => {
                alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    self.table_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
            },
            TableFactor::TableFunction { alias, .. } => {
                alias.as_ref().map(|a| {
                    let alias_name = a.name.value.clone();
                    self.table_aliases.insert(alias_name.clone(), alias_name.clone());
                    alias_name
                })
            },
            TableFactor::NestedJoin { .. } => None,
            _ => None,
        }
    }

    fn process_query(&mut self, query: &Query) -> Result<(), SqlAnalyzerError> {
        let mut is_with_query = false;
        if let Some(with) = &query.with {
            is_with_query = true;
            self.cte_aliases.push(HashSet::new());
            for cte in &with.cte_tables {
                self.process_cte(cte)?;
            }
        }

        match query.body.as_ref() {
            SetExpr::Select(select) => {
                self.current_from_relation_identifier = None;
                for table_with_joins in &select.from {
                    self.process_table_factor(&table_with_joins.relation);
                    self.current_from_relation_identifier = self.get_factor_identifier_and_register_alias(&table_with_joins.relation);
                    for join in &table_with_joins.joins {
                        self.process_join(join);
                    }
                }
                if let Some(selection) = &select.selection { selection.visit(self); }
                if let sqlparser::ast::GroupByExpr::Expressions(exprs, _) = &select.group_by {
                    for expr in exprs { expr.visit(self); }
                }
                if let Some(having) = &select.having { having.visit(self); }
                for item in &select.projection { self.process_select_item(item); }
            }
            SetExpr::Query(inner_query) => {
                self.process_query(inner_query)?;
            }
            SetExpr::SetOperation { left, right, .. } => {
                self.process_query_body(left)?;
                self.process_query_body(right)?;
            }
            _ => {}
        }

        query.visit(self);

        if is_with_query {
            self.cte_aliases.pop();
        }

        Ok(())
    }

    fn process_query_body(&mut self, query_body: &SetExpr) -> Result<(), SqlAnalyzerError> {
        match query_body {
            SetExpr::Select(_) | SetExpr::Query(_) | SetExpr::SetOperation {..} => {
                let temp_query = Query {
                    with: None,
                    body: Box::new(query_body.clone()),
                    order_by: None,
                    limit: None,
                    limit_by: vec![],
                    offset: None,
                    fetch: None,
                    locks: vec![],
                    for_clause: None,
                    settings: None,
                    format_clause: None,
                };
                self.process_query(&temp_query)?;
            }
            _ => {}
        }
        Ok(())
    }

    fn process_cte(&mut self, cte: &Cte) -> Result<(), SqlAnalyzerError> {
        let cte_name = cte.alias.name.value.clone();
        let mut cte_analyzer = QueryAnalyzer::new();
        cte_analyzer.cte_aliases = self.cte_aliases.clone();
        // Do not inherit table_aliases; start fresh for this scope
        cte_analyzer.scope_stack.push(cte_name.clone());

        let cte_analysis_result = cte_analyzer.process_query(&cte.query);

        match cte_analysis_result {
            Ok(()) => {
                match cte_analyzer.into_summary() {
                    Ok(summary) => {
                        self.ctes.push(CteSummary {
                            name: cte_name.clone(),
                            summary: Box::new(summary),
                            column_mappings: HashMap::new(),
                        });
                        if let Some(current_scope_aliases) = self.cte_aliases.last_mut() {
                            current_scope_aliases.insert(cte_name.clone());
                        }
                        self.table_aliases.insert(cte_name.clone(), cte_name);
                        Ok(())
                    }
                    Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                        Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
                    }
                    Err(e) => {
                        Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Internal error summarizing CTE '{}': {}", cte_name, e)))
                    }
                }
            }
            Err(e @ SqlAnalyzerError::VagueReferences(_)) => {
                Err(SqlAnalyzerError::VagueReferences(format!("In CTE '{}': {}", cte_name, e)))
            }
            Err(e) => {
                Err(SqlAnalyzerError::Internal(anyhow::anyhow!("Error processing CTE '{}': {}", cte_name, e)))
            }
        }
    }

    fn process_table_factor(&mut self, table_factor: &TableFactor) {
        match table_factor {
            TableFactor::Table { name, alias: _, .. } => {
                let base_identifier = self.get_table_name(name);
                if name.0.len() > 1 || !self.is_cte(&base_identifier) {
                    let (db, schema, table_part) = self.parse_object_name(name);
                    self.tables.entry(base_identifier.clone()).or_insert(TableInfo {
                        database_identifier: db,
                        schema_identifier: schema,
                        table_identifier: table_part,
                        alias: None,
                        columns: HashSet::new(),
                        kind: crate::types::TableKind::Base,
                        subquery_summary: None,
                    });
                }
            },
            TableFactor::Derived { subquery, alias, .. } => {
                let subquery_alias_opt = alias.as_ref().map(|a| a.name.value.clone());
                let scope_name = subquery_alias_opt.clone().unwrap_or_else(|| "unaliased_subquery".to_string());
                self.scope_stack.push(scope_name.clone());
                let mut subquery_analyzer = QueryAnalyzer::new();
                subquery_analyzer.cte_aliases = self.cte_aliases.clone();
                // Do not inherit table_aliases; start fresh for this scope
                let sub_result = subquery_analyzer.process_query(subquery);
                self.scope_stack.pop();
                match sub_result {
                    Ok(()) => {
                        match subquery_analyzer.into_summary() {
                            Ok(summary) => {
                                for table_info in summary.tables {
                                    self.tables.insert(table_info.table_identifier.clone(), table_info);
                                }
                                self.joins.extend(summary.joins);
                            }
                            Err(SqlAnalyzerError::VagueReferences(msg)) => {
                                self.vague_tables.push(format!("Subquery '{}': {}", scope_name, msg));
                            }
                            Err(e) => { eprintln!("Warning: Internal error summarizing subquery '{}': {}", scope_name, e); }
                        }
                    }
                    Err(SqlAnalyzerError::VagueReferences(msg)) => {
                        self.vague_tables.push(format!("Subquery '{}': {}", scope_name, msg));
                    }
                    Err(e) => { eprintln!("Warning: Error processing subquery '{}': {}", scope_name, e); }
                }
            },
            TableFactor::TableFunction { expr, alias } => {
                expr.visit(self);
            },
            TableFactor::NestedJoin { table_with_joins, alias } => {
                self.process_table_factor(&table_with_joins.relation);
                for join in &table_with_joins.joins {
                    self.process_table_factor(&join.relation);
                    match &join.join_operator {
                        JoinOperator::Inner(JoinConstraint::On(expr))
                        | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                        | JoinOperator::RightOuter(JoinConstraint::On(expr))
                        | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                            self.process_join_condition(expr);
                        }
                        _ => {}
                    }
                }
            }
            _ => {}
        }
    }

    fn process_join(&mut self, join: &Join) {
        self.process_table_factor(&join.relation);
        let right_identifier_opt = self.get_factor_identifier_and_register_alias(&join.relation);
        let left_identifier_opt = self.current_from_relation_identifier.clone();
        if let (Some(left_id), Some(right_id)) = (&left_identifier_opt, &right_identifier_opt) {
            let condition = match &join.join_operator {
                JoinOperator::Inner(JoinConstraint::On(expr))
                | JoinOperator::LeftOuter(JoinConstraint::On(expr))
                | JoinOperator::RightOuter(JoinConstraint::On(expr))
                | JoinOperator::FullOuter(JoinConstraint::On(expr)) => {
                    self.process_join_condition(expr);
                    expr.to_string()
                }
                JoinOperator::Inner(JoinConstraint::Using(idents))
                | JoinOperator::LeftOuter(JoinConstraint::Using(idents))
                | JoinOperator::RightOuter(JoinConstraint::Using(idents))
                | JoinOperator::FullOuter(JoinConstraint::Using(idents)) => {
                    for ident in idents { self.vague_columns.push(format!("USING({})", ident.0.last().map(|id| id.value.clone()).unwrap_or_default())); }
                    format!("USING({})", idents.iter().map(|i| i.0.last().map(|id| id.value.clone()).unwrap_or_default()).collect::<Vec<_>>().join(", "))
                }
                JoinOperator::Inner(JoinConstraint::Natural)
                | JoinOperator::LeftOuter(JoinConstraint::Natural)
                | JoinOperator::RightOuter(JoinConstraint::Natural)
                | JoinOperator::FullOuter(JoinConstraint::Natural) => "NATURAL".to_string(),
                JoinOperator::CrossJoin => "CROSS JOIN".to_string(),
                _ => "UNKNOWN_CONSTRAINT".to_string(),
            };
            self.joins.insert(JoinInfo {
                left_table: left_id.clone(),
                right_table: right_id.clone(),
                condition,
            });
        }
        if right_identifier_opt.is_some() {
            self.current_from_relation_identifier = right_identifier_opt;
        }
    }

    fn process_join_condition(&mut self, expr: &Expr) {
        expr.visit(self);
    }

    fn process_select_item(&mut self, select_item: &SelectItem) {
        match select_item {
            SelectItem::UnnamedExpr(expr) | SelectItem::ExprWithAlias { expr, .. } => {
                expr.visit(self);
            },
            SelectItem::QualifiedWildcard(obj_name, _) => {
                let qualifier = obj_name.0.first().map(|i|i.value.clone()).unwrap_or_default();
                if !qualifier.is_empty() {
                    // Handle if needed
                }
            }
            SelectItem::Wildcard(_) => {
                // Handle if needed
            }
        }
    }

    fn into_summary(mut self) -> Result<QuerySummary, SqlAnalyzerError> {
        for (alias, identifier) in &self.table_aliases {
            if let Some(table_info) = self.tables.get_mut(identifier) {
                if table_info.alias.is_none() || identifier == alias {
                    table_info.alias = Some(alias.clone());
                }
            }
        }
        self.vague_columns.sort();
        self.vague_columns.dedup();
        self.vague_tables.sort();
        self.vague_tables.dedup();
        if !self.vague_columns.is_empty() || !self.vague_tables.is_empty() {
            let mut errors = Vec::new();
            if !self.vague_columns.is_empty() {
                errors.push(format!("Vague columns (missing table/alias qualifier): {:?}", self.vague_columns));
            }
            if !self.vague_tables.is_empty() {
                errors.push(format!("Vague/Unknown tables or CTEs: {:?}", self.vague_tables));
            }
            return Err(SqlAnalyzerError::VagueReferences(errors.join("\n")));
        }
        Ok(QuerySummary {
            tables: self.tables.into_values().collect(),
            joins: self.joins,
            ctes: self.ctes,
        })
    }

    fn is_cte(&self, name: &str) -> bool {
        self.cte_aliases.iter().rev().any(|scope| scope.contains(name))
    }

    fn add_column_reference(&mut self, qualifier: &str, column: &str) {
        let resolved_identifier = self.table_aliases.get(qualifier).cloned().unwrap_or_else(|| qualifier.to_string());
        let is_known_base_table = self.tables.contains_key(&resolved_identifier);
        let is_known_alias = self.table_aliases.contains_key(qualifier);
        let is_known_cte = self.is_cte(qualifier);

        if is_known_alias || is_known_cte || is_known_base_table {
            if let Some(table_info) = self.tables.get_mut(&resolved_identifier) {
                table_info.columns.insert(column.to_string());
            }
        } else {
            self.vague_tables.push(qualifier.to_string());
        }
    }

    fn parse_object_name(&mut self, name: &ObjectName) -> (Option<String>, Option<String>, String) {
        let idents: Vec<String> = name.0.iter().map(|i| i.value.clone()).collect();
        match idents.len() {
            1 => {
                let table_name = idents[0].clone();
                if !self.is_cte(&table_name) {
                    self.vague_tables.push(table_name.clone());
                }
                (None, None, table_name)
            }
            2 => (None, Some(idents[0].clone()), idents[1].clone()),
            3 => (Some(idents[0].clone()), Some(idents[1].clone()), idents[2].clone()),
            _ => (None, None, idents.last().cloned().unwrap_or_default())
        }
    }

    fn get_table_name(&self, name: &ObjectName) -> String {
        name.0.last().map(|i| i.value.clone()).unwrap_or_default()
    }
}

impl Visitor for QueryAnalyzer {
    type Break = ();

    fn pre_visit_expr(&mut self, expr: &Expr) -> ControlFlow<Self::Break> {
        match expr {
            Expr::Identifier(ident) => {
                self.vague_columns.push(ident.value.clone());
                ControlFlow::Continue(())
            },
            Expr::CompoundIdentifier(idents) if idents.len() >= 2 => {
                let column = idents.last().unwrap().value.clone();
                let qualifier = idents[idents.len() - 2].value.clone();
                self.add_column_reference(&qualifier, &column);
                ControlFlow::Continue(())
            },
            Expr::Subquery(query) | Expr::InSubquery { subquery: query, .. } => {
                let mut sub_analyzer = QueryAnalyzer::new();
                sub_analyzer.cte_aliases = self.cte_aliases.clone();
                // Do not inherit table_aliases
                match sub_analyzer.process_query(query) {
                    Ok(_) => {},
                    Err(SqlAnalyzerError::VagueReferences(msg)) => {
                        self.vague_tables.push(format!("Nested Query Error: {}", msg));
                    }
                    Err(e) => {
                        eprintln!("Warning: Error analyzing nested query: {}", e);
                    }
                }
                ControlFlow::Continue(())
            },
            _ => ControlFlow::Continue(())
        }
    }
}