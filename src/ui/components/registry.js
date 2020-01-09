/** @module */

import Component from './component';

import NavigationComponent from './navigation/navigationcomponent';

import SearchComponent from './search/searchcomponent';
import FilterSearchComponent from './search/filtersearchcomponent';
import AutoCompleteComponent from './search/autocompletecomponent';
import SpellCheckComponent from './search/spellcheckcomponent';
import LocationBiasComponent from './search/locationbiascomponent';

import FilterBoxComponent from './filters/filterboxcomponent';
import FilterOptionsComponent from './filters/filteroptionscomponent';
import RangeFilterComponent from './filters/rangefiltercomponent';
import DateRangeFilterComponent from './filters/daterangefiltercomponent';
import FacetsComponent from './filters/facetscomponent';
import GeoLocationComponent from './filters/geolocationcomponent';

import DirectAnswerComponent from './results/directanswercomponent';
import ResultsComponent from './results/resultscomponent';
import AccordionResultsComponent from './results/accordionresultscomponent.js';
import UniversalResultsComponent from './results/universalresultscomponent';
import PaginationComponent from './results/paginationcomponent';

import ResultsItemComponent from './results/resultsitemcomponent';
import LocationResultsItemComponent from './results/locationresultsitemcomponent';
import EventResultsItemComponent from './results/eventresultsitemcomponent';

import PeopleResultsItemComponent from './results/peopleresultsitemcomponent';

import MapComponent from './map/mapcomponent';
import QuestionSubmissionComponent from './questions/questionsubmissioncomponent';

import IconComponent from './icons/iconcomponent.js';
import TimelineComponent from './search/timelinecomponent';

const COMPONENT_CLASS_LIST = [
  // Core Component
  Component,

  // Navigation Components
  NavigationComponent,

  // Search Components
  SearchComponent,
  FilterSearchComponent,
  AutoCompleteComponent,
  SpellCheckComponent,
  LocationBiasComponent,
  TimelineComponent,

  // Filter Components
  FilterBoxComponent,
  FilterOptionsComponent,
  RangeFilterComponent,
  DateRangeFilterComponent,
  FacetsComponent,
  GeoLocationComponent,

  // Results Components
  DirectAnswerComponent,
  UniversalResultsComponent,
  ResultsComponent,
  PaginationComponent,
  ResultsItemComponent,
  AccordionResultsComponent,
  LocationResultsItemComponent,
  EventResultsItemComponent,
  PeopleResultsItemComponent,
  MapComponent,

  // Questions Components
  QuestionSubmissionComponent,

  // Helper Components
  IconComponent
];

/**
 * The component registry is a map that contains
 * all available component classes used for creation or extension.
 * Each component class has a unique type, which is used as the key for the registry
 * @type {Object.<string, Component>}
 */
export const COMPONENT_REGISTRY = COMPONENT_CLASS_LIST.reduce((registry, clazz) => {
  registry[clazz.type] = clazz;
  return registry;
}, {});
