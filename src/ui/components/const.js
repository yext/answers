import ComponentManager from './componentmanager';

import Component from './component';

import NavigationComponent from './navigation/navigationcomponent';

import SearchComponent from './search/searchcomponent';
import AutoCompleteComponent from './search/autocompletecomponent';

import DirectAnswerComponent from './results/directanswercomponent';
import ResultsComponent from './results/resultscomponent';
import UniversalResultsComponent from './results/universalresultscomponent';

import ResultsItemComponent from './results/resultsitemcomponent';
import LocationResultsItemComponent from './results/locationresultsitemcomponent';
import EventResultsItemComponent from './results/eventresultsitemcomponent';
import PeopleResultsItemComponent from './results/peopleresultsitemcomponent';

import QuestionSubmissionComponent from './questions/questionsubmissioncomponent';

export const COMPONENT_MANAGER = new ComponentManager()
      // Core Component
      .register(Component)

      // Navigation Components
      .register(NavigationComponent)

      // Search Components
      .register(SearchComponent)
      .register(AutoCompleteComponent)

      // Results Components
      .register(DirectAnswerComponent)
      .register(UniversalResultsComponent)
      .register(ResultsComponent)
      .register(ResultsItemComponent)
      .register(LocationResultsItemComponent)
      .register(EventResultsItemComponent)
      .register(PeopleResultsItemComponent)

      // Questions Components
      .register(QuestionSubmissionComponent)