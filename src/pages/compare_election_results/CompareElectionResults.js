import React, { useEffect, useMemo, useState } from 'react';
import styles from './CompareElectionResults.module.css'
import { get_rule_properties } from '../../utils/database_api';
import ElectionList from '../../components/elections/ElectionList';
import SatisfactionHistogram from '../../components/charts/SatisfactionHistogram';
import RulePropertyRadarChart from '../../components/charts/RulePropertyRadarChart';
import {useLocation, useOutletContext} from 'react-router-dom';
import CategoryProportion from '../../components/charts/CategoryProportions';
import NetworkError from '../../components/reusables/NetworkError';
import ElectionDetails from '../../components/elections/ElectionDetails';

const rule_properties_short_names = [
  "avg_card_satisfaction",
  "avg_cost_satisfaction",
  "avg_rel_cost_satisfaction",
  // "category_proportionality",
  "equality",
  // "fairness",
  "happiness",
]


function ElectionGraphs(props) {
  const { election_id, rules, rule_visibility, rule_properties } = props;
  return (
    <>
      <div className={styles.graph_container}>
        <CategoryProportion
          election_id={election_id}
          rules={rules}
          rule_visibility={rule_visibility}
        />
      </div>
      <div className={styles.graph_container}>
        <RulePropertyRadarChart
          rules={rules}
          rule_properties={rule_properties}
          election_filters={{id_list: [election_id]}}
          rule_visibility={rule_visibility}
          hide_num_elections={true}
        />
      </div>
      <div className={styles.graph_container}>
        <SatisfactionHistogram
          rules={rules}
          election_filters={{id_list: [election_id]}}
          rule_visibility={rule_visibility}
          hide_num_elections={true}
        />
      </div>
    </>
  )
}

export default function CompareElectionResults(props) { 
  
  const location = useLocation();
  const {ballot_type_selected, rule_list, rule_visibility} = useOutletContext();

  const [elections_selected, set_elections_selected] =  useState(new Map([]));
  const [rule_properties, set_rule_properties] =  useState(undefined);
  
  const [error, set_error] = useState(false);


  useEffect(() => {
    set_elections_selected(new Map([]))
  }, [ballot_type_selected]);


  useEffect(() => {
    let [rule_properties_promise, abort_controller] = get_rule_properties(rule_properties_short_names);
    rule_properties_promise.then((response) => {
      if (response){
        set_rule_properties(response.data)    
      }
    }).catch(() => set_error(true));

    return () => abort_controller.abort();
  }, []);


  
  const render_election_graphs = () => {

    const election_graphs = Array.from(elections_selected).map(([name, election], index) => {
      
      return(
      <div className={styles.election_container} key={election.name}>
        <div className={styles.election_title}>
          <p>
            {election.unit + (election.subunit ? ", " + election.subunit : "") + ". " + new Date(election.date_begin).getFullYear()}
          </p>
        </div>
        <ElectionDetails election={election}/>
        <ElectionGraphs
          election_id={election.id}
          rules={rule_list}
          rule_properties={rule_properties}
          rule_visibility={rule_visibility}
        />
      </div>
    )});

    return (
      <div className={styles.graphs_wrapper}>
        {election_graphs}
      </div>
    )
  }


  return (
    <div className={styles.content_container} >
      <div className={styles.elections_box}>
        <ElectionList
          ballot_type={ballot_type_selected}
          elections_selected={elections_selected}
          set_elections_selected={set_elections_selected} 
          max_selected={2}
          initial_election_filters={location.state && location.state.election_filters ? location.state.election_filters : {}}
        /> 
      </div>
      <div className={styles.graphs_box}>
        {error ? 
          <NetworkError/> :
          rule_list && elections_selected.size > 0 ?
          render_election_graphs() :
          <pre className={styles.no_election_selected_text}>
            {"↑  Select up to two elections  ↑"}
          </pre>
        }
      </div>
      {/* <button onClick={on_debug_button_click}>Click me!</button> */}
    </div>
  );
}
