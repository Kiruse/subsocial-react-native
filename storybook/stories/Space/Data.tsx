import React, { useCallback } from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SpaceId, SpaceWithSomeDetails } from 'src/types/subsocial'
import { useCreateReloadSpace, useResolvedSpaceHandle, useSelectSpace } from 'src/rtk/app/hooks'
import { useInit } from '~comps/hooks'
import { ExploreStackNavigationProp } from '~comps/ExploreStackNav'
import { Header, SocialLinks as Socials, Tags } from '~stories/Misc'
import { ActionMenu, FollowButton } from '~stories/Actions'
import { Markdown, Text } from '~comps/Typography'
import { summarizeMd } from '@subsocial/utils'

const SUMMARY_LIMIT = 200

export type DataProps = Omit<DataRawProps, 'data'> & {
  id: SpaceId
}
export const Data = React.memo(({ id, ...props }: DataProps) => {
  const realid = useResolvedSpaceHandle(id)
  const data = useSelectSpace(realid)
  const reloadSpace = useCreateReloadSpace()
  
  useInit(async () => {
    if (data) return true
    
    if (!reloadSpace) return false
    
    await reloadSpace({ id })
    return true
  }, [ id ], [ reloadSpace ])
  
  return (
    <DataRaw
      data={data}
      {...props}
    />
  )
})

export type DataRawProps = {
  data?: SpaceWithSomeDetails
  titlePlaceholder?: string
  showFollowButton?: boolean
  showAbout?: boolean
  showSocials?: boolean
  showTags?: boolean
  preview?: boolean
  containerStyle?: StyleProp<ViewStyle>
  onPressSpace?: (id: SpaceId) => void
}
export const DataRaw = React.memo(({
  data,
  titlePlaceholder,
  showFollowButton,
  showAbout,
  showSocials,
  showTags,
  preview = false,
  containerStyle,
  onPressSpace: _onPressSpace,
}: DataRawProps) =>
{
  const nav = useNavigation<ExploreStackNavigationProp | undefined>()
  const onPressSpace = useCallback(() => {
    const spaceId = data?.struct?.id
    
    if (spaceId) {
      if (_onPressSpace) {
        _onPressSpace(spaceId)
      }
      else if (preview && nav?.push) {
        nav.push('Space', { spaceId })
      }
    }
  }, [ data, _onPressSpace ])
  
  return (
    <View style={[ { width: '100%' }, containerStyle ]}>
      <Head {...{ titlePlaceholder, data, showFollowButton }} onPressSpace={onPressSpace} />
      
      {showAbout   && <About {...{data, preview}} onPressMore={onPressSpace} />}
      {showSocials && <Socials links={data?.content?.links??[]} containerStyle={{ marginBottom: 10 }} />}
      {showTags    && <Tags tags={data?.content?.tags??[]} style={{ marginBottom: 8 }} />}
    </View>
  )
})

export type HeadProps = {
  titlePlaceholder?: string
  data?: SpaceWithSomeDetails
  showFollowButton?: boolean
  onPressSpace?: () => void
}
export function Head({ titlePlaceholder = '', data, showFollowButton, onPressSpace }: HeadProps) {
  const renderPrimaryActions = useCallback(() => {
    return <>
      {showFollowButton && (
        <ActionMenu.Primary>
          <FollowButton
            id={data?.struct?.id ?? '0'}
            isFollowing={false}
            onPress={() => alert('not yet implemented, sorry!')}
          />
        </ActionMenu.Primary>
      )}
    </>
  }, [])
  
  const renderSecondaryActions = useCallback(() => {
    return <>
      <ActionMenu.Secondary
        label="Share Space"
        icon={{
          family: 'ionicon',
          name: 'share-social-outline',
        }}
        onPress={() => {}}
      />
      <ActionMenu.Secondary
        label="View on IPFS"
        icon={{
          family: 'ionicon',
          name: 'analytics-outline',
        }}
        onPress={() => {}}
      />
    </>
  }, []);
  
  return (
    <Header
      title={data?.content?.name ?? titlePlaceholder}
      onPressTitle={onPressSpace}
      subtitle={`${data?.struct?.postsCount || 0} Posts · ${data?.struct?.followersCount || 0} Followers`}
      avatar={data?.content?.image}
      onPressAvatar={onPressSpace}
      actionMenuProps={{
        primary: renderPrimaryActions,
        secondary: renderSecondaryActions
      }}
    />
  )
}

export type AboutProps = {
  data?: SpaceWithSomeDetails
  preview: boolean
  onPressMore?: (id: SpaceId) => void
}
export function About({ data, preview, onPressMore: _onPressMore }: AboutProps) {
  const onPressMore = useCallback(() => {
    if (data?.id) {
      _onPressMore?.(data.id)
    }
  }, [ data, _onPressMore ])
  
  if (!data?.content?.about) return null
  
  if (preview) {
    const {summary, isShowMore} = summarizeMd(data.content.about, { limit: SUMMARY_LIMIT })
    
    return (
      <Text onPress={onPressMore} style={styles.item}>
        {summary}
        {isShowMore && <Text style={{fontWeight: 'bold'}}>{' '}Read more</Text>}
      </Text>
    )
  }
  
  return <Markdown style={mdStyles}>{data!.content!.about!}</Markdown>
}

const styles = StyleSheet.create({
  item: {
    marginBottom: 16,
  },
})

const mdStyles = StyleSheet.create({
  paragraph: {}, // Do not delete - this tells MarkdownIt to not apply any styles!
})