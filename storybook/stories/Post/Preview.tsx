//////////////////////////////////////////////////////////////////////
// Post Preview - assembled from Post Base components
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useCreateReloadPost, useSelectPost } from 'src/rtk/app/hooks'
import { useAccount } from '~stories/Account'
import { useInit } from '~comps/hooks'
import { useSpace } from '~stories/Space'
import { Head, Body } from './Post'
import { Header } from '~stories/Misc'
import { ActionPanel } from './ActionPanel'
import { ActionMenu, IconDescriptor } from '~stories/Actions'
import { AccountId, PostId, SpaceId, PostWithSomeDetails } from 'src/types/subsocial'
import { Age } from 'src/util'
import BN from 'bn.js'

const ICON_REACTIONS: IconDescriptor = {name: 'bulb-outline',      family: 'ionicon'}
const ICON_IPFS:      IconDescriptor = {name: 'analytics-outline', family: 'ionicon'}

export type PostPreviewProps = Omit<PreviewDataProps, 'id' | 'state' | 'data'> & {
  id: PostId
}
export default function Preview({id, ...props}: PostPreviewProps) {
  const reloadPost = useCreateReloadPost()
  const data = useSelectPost(id)
  
  useInit(() => {
    if (!reloadPost) return false
    reloadPost({id})
    return true
  }, [id], [reloadPost])
  
  return <Preview.Data {...props} {...{id, data}} />
}

type PreviewDataProps = {
  id: PostId
  data: PostWithSomeDetails | undefined
  onPressMore?: (id: PostId) => void
  onPressOwner?: (postId: PostId, ownerId: AccountId | undefined) => void
  onPressSpace?: (postId: PostId, spaceId: SpaceId   | undefined) => void
};
Preview.Data = function({id, data, onPressMore, onPressOwner, onPressSpace}: PreviewDataProps) {
  const [ownerid, spaceid] = useMemo(() => {
    const {owner, space} = data ?? {};
    return [
      owner?.id,
      space?.id,
    ]
  }, [data]);
  
  const renderActions = ({size}: {size: number}) => <>
    <ActionMenu.Secondary label="View reactions" icon={{...ICON_REACTIONS, size}} onPress={() => alert('not yet implemented, sorry')} />
    <ActionMenu.Secondary label="View on IPFS"   icon={{...ICON_IPFS,      size}} onPress={() => alert('not yet implemented, sorry')} />
  </>;
  
  const {title = 'loading', body: content = '', image} = data?.post?.content ?? {};
  const {avatar, ownerName, spaceName, age} = getTitle(ownerid, spaceid, data);
  
  return (
    <View style={styles.container}>
      <Header
        title={ownerName??''}
        subtitle={`${spaceName} · ${age}`}
        avatar={avatar}
        actionMenuProps={{
          secondary: renderActions
        }}
        onPressTitle={() => onPressOwner?.(id, ownerid)}
        onPressSubtitle={() => onPressSpace?.(id, spaceid)}
        onPressAvatar={() => onPressOwner?.(id, ownerid)}
      />
      <Pressable onPress={() => onPressMore?.(id)}>
        <Head {...{title, image}} titleStyle={[!data && styles.italic]} preview />
        <Body content={content} preview />
      </Pressable>
      <ActionPanel
        liked={false}
        numLikes={data?.post?.struct?.upvotesCount ?? 0}
        numComments={data?.post?.struct?.repliesCount ?? 0}
        onPressLike={   () => alert('sorry, not yet implemented')}
        onPressComment={() => alert('sorry, not yet implemented')}
        onPressShare={  () => alert('sorry, not yet implemented')}
      />
    </View>
  )
}

type TitleData = {
  avatar: string | undefined // CID
  ownerName: string | undefined
  spaceName: string | undefined
  age: Age
}
function getTitle(ownerid: AccountId | undefined, spaceid: SpaceId | undefined, data: PostWithSomeDetails | undefined): TitleData {
  const [/* spaceState */, spaceData] = useSpace(spaceid ?? 0);
  const [/* ownerState */, ownerData] = useAccount(ownerid ?? '');
  
  return {
    avatar: ownerData?.content?.avatar,
    ownerName: ownerData?.content?.name,
    spaceName: spaceData?.content?.name,
    age: new Age(new BN(data?.post?.struct?.createdAtTime ?? 0)),
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
  },
  titleWrapper: {
    paddingTop: 6,
  },
  title: {
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  italic: {
    fontStyle: 'italic',
  },
});
