import { SubsocialApi } from '@subsocial/api'
import { useSubsocial } from 'src/components/SubsocialContext'
import { AsyncThunk, EntityId } from '@reduxjs/toolkit'
import { getFirstOrUndefined, isEmptyArray, nonEmptyStr } from '@subsocial/utils'
import { CommonContent, EntityData, FlatSuperCommon, HasId } from 'src/types/subsocial'
import { asString } from '@subsocial/utils'
import { RootState } from './rootReducer'
import { AppDispatch, AppThunk } from './store'
import { useAppDispatch } from './hooksCommon'

export type ThunkApiConfig = {
  state: RootState
  dispatch: AppDispatch
}

type StructEntity = HasId & Partial<FlatSuperCommon>

type ContentEntity = HasId & CommonContent

export type CommonVisibility = 'onlyPublic' | 'onlyUnlisted'
export type HasHiddenVisibility = CommonVisibility | 'onlyVisible' | 'onlyHidden'

export type ApiArg = {
  api: SubsocialApi,
}

export type CommonFetchProps = ApiArg & {
  reload?: boolean
}

type CommonFetchPropsAndId = CommonFetchProps & {
  id: EntityId
}

export type CommonFetchPropsAndIds = CommonFetchProps & {
  ids: EntityId[]
}

export type SelectOneArgs <T> = T & {
  id: EntityId
}

export type SelectManyArgs <T> = T & {
  ids: EntityId[]
}

export type FetchOneArgs <T> = T & CommonFetchPropsAndId

export type FetchManyArgs <T> = T & CommonFetchPropsAndIds

export function createSelectUnknownIds (selectIds: (state: RootState) => EntityId[]) {
  return (state: RootState, ids: EntityId[]): string[] => {
    if (isEmptyArray(ids)) return []

    const knownStrIds = selectIds(state).map(asString)
    const knownIds = new Set(knownStrIds)
    const newIds: string[] = []

    ids.forEach(id => {
      const strId = asString(id)
      if (!knownIds.has(strId)) {
        knownIds.add(strId)
        newIds.push(strId)
      }
    })

    return newIds
  }
}

function toParamsAndIds ({ id, ...params }: CommonFetchPropsAndId): CommonFetchPropsAndIds {
  return { ...params, ids: [ id ] }
}

type FetchManyFn<Returned> = AsyncThunk<Returned[], CommonFetchPropsAndIds, {}>

export function createFetchOne<R> (fetchMany: FetchManyFn<R>) {
  return (arg: CommonFetchPropsAndId): AppThunk => async dispatch => {
    await dispatch(fetchMany(toParamsAndIds(arg)))
  }
}

// export function createFetchMany<
//   S extends StructEntity,
//   C extends ContentEntity
// > (
//   fetchManyStructs: FetchManyFn<S>,
//   fetchManyContents: FetchManyFn<C>,
// ) {
//   return (arg: ApiAndIds): AppThunk => async dispatch => {
//     await dispatch(fetchManyStructs(arg))
//     await dispatch(fetchManyContents(arg))
//   }
// }

export type SelectByIdFn<R> = (state: RootState, id: EntityId) => R | undefined

export function selectManyByIds<
  S extends StructEntity,
  C extends ContentEntity
> (
  state: RootState,
  ids: EntityId[],
  selectStructById: SelectByIdFn<S>,
  selectContentById: SelectByIdFn<C>
): EntityData<S, C>[] {

  const result: EntityData<S, C>[] = []

  ids.forEach((id) => {
    const struct = selectStructById(state, id)
    if (struct) {
      const item: EntityData<S, C> = {
        id: struct.id,
        struct,
      }

      if (nonEmptyStr(struct.contentId)) {
        const { contentId } = struct
        item.content = selectContentById(state, contentId)
      }

      result.push(item)

    }
  })

  return result
}

export function selectOneById<
  S extends StructEntity,
  C extends ContentEntity
> (
  state: RootState,
  id: EntityId,
  selectStructById: SelectByIdFn<S>,
  selectContentById: SelectByIdFn<C>
): EntityData<S, C> | undefined {
  const items = selectManyByIds(state, [ id ], selectStructById, selectContentById)
  return getFirstOrUndefined(items)
}

type CommonDispatchCallbackProps<T> = {
  dispatch: AppDispatch,
  api: SubsocialApi,
  args: T
}

type CommonDispatchCallback<T, R = any> = (props: CommonDispatchCallbackProps<T>) => R | Promise<R>

// ? Change cb on actions[]. And use actions.forEach(action => dispatch(action))
export const useActions = <T, R = any>(cb: CommonDispatchCallback<T, R>) => {
  const dispatch = useAppDispatch()
  const { api } = useSubsocial()
  return (args: T) => cb({ dispatch, api, args })
}
