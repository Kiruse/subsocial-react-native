import React from 'react';
import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react-native';
import { Text } from 'react-native';
import Post from '.';
import CenterView from '../CenterView';

storiesOf('Post', module)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add('some story', () => {
    return <Text>:D</Text>
  })
  ;