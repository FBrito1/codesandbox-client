import React from 'react';
import { useQuery } from '@apollo/react-hooks';
import {
  ListPersonalTemplatesQuery,
  ListPersonalTemplatesQueryVariables,
} from 'app/graphql/types';
import { LIST_PERSONAL_TEMPLATES } from 'app/components/CreateNewSandbox/queries';
import { Loader } from '../../Loader/index';
import { ITemplateInfo } from '../../TemplateList';
import { CenteredMessage } from '../elements';
import { FilteredTemplates } from './FilteredTemplates';
import { DynamicWidthTemplateList } from '../../TemplateList/DynamicWidthTemplateList';

interface IPersonalTemplatesProps {
  filter: string;
  officialTemplateInfos: ITemplateInfo[];
  hasLogIn: boolean;
}

export const PersonalTemplates = ({
  filter,
  officialTemplateInfos,
  hasLogIn,
}: IPersonalTemplatesProps) => {
  const { data, error } = useQuery<
    ListPersonalTemplatesQuery,
    ListPersonalTemplatesQueryVariables
  >(LIST_PERSONAL_TEMPLATES, {
    variables: {},
    fetchPolicy: 'cache-and-network',
    skip: !hasLogIn,
  });

  if (error) {
    return (
      <CenteredMessage>
        Something went wrong while fetching your templates, please try again in
        a minute.
      </CenteredMessage>
    );
  }

  // Instead of checking the loading var we check this. Apollo sets the loading
  // var to true even if we still have cached data that we can use.
  if (hasLogIn && typeof data?.me === 'undefined') {
    return <Loader />;
  }

  const personalTemplateInfos: ITemplateInfo[] = hasLogIn
    ? [
        {
          title: 'Recently Used Templates',
          key: 'recently-used-templates',
          templates: data.me.recentlyUsedTemplates,
        },
        {
          title: 'My Templates',
          key: 'my-templates',
          templates: data.me.templates,
          isOwned: true,
        },
        ...data.me.teams
          .filter(t => t.templates.length > 0)
          .map(team => ({
            key: `${team.id}-templates`,
            title: `${team.name}${
              team.name.endsWith('s') ? "'" : "'s"
            } Templates`,
            templates: team.templates,
            isOwned: true,
          })),

        {
          title: 'My Bookmarked Templates',
          key: 'my-bookmarked-templates',
          templates: data.me.bookmarkedTemplates,
        },
        ...data.me.teams
          .filter(t => t.bookmarkedTemplates.length > 0)
          .map(team => ({
            key: `${team.id}-bookmarked-templates`,
            title: `${team.name}${
              team.name.endsWith('s') ? "'" : "'s"
            } Bookmarked Templates`,
            templates: team.bookmarkedTemplates,
          })),
      ]
    : [];

  const allTemplateInfos: ITemplateInfo[] = [
    ...personalTemplateInfos,
    ...officialTemplateInfos,
  ];

  const hasNoTemplates =
    hasLogIn &&
    data.me.templates.length === 0 &&
    data.me.bookmarkedTemplates.length === 0;

  if (hasNoTemplates) {
    return (
      <CenteredMessage>
        You don{"'"}t have any templates yet, go on and create or bookmark some!
      </CenteredMessage>
    );
  }

  return filter ? (
    <FilteredTemplates
      forkOnOpen
      query={filter}
      templateInfos={allTemplateInfos}
    />
  ) : (
    <DynamicWidthTemplateList
      showSecondaryShortcuts
      forkOnOpen
      templateInfos={allTemplateInfos}
    />
  );
};
