import copyToClipboard from 'copy-to-clipboard'
import { observer } from 'mobx-react-lite'
import React, { FC, MouseEvent, useCallback } from 'react'
import styled from 'styled-components'
import { CardDes } from '../../Card/components/card-des'
import { CardGrid } from '../../Card/components/card-grid'
import { CardRuby } from '../../Card/components/card-ruby'
import { CardError } from '../../Card/components/error'
import { serverFetch } from '../../Fetch/server-fetch'
import { Row } from '../../Grid/components/row'
import { gettext } from '../../Language'
import { OK, TOO_MANY_REQUESTS } from '../../Restful/http-status'
import { template } from '../../Utils/components/template'
import { ServerBenchmarkConstants } from '../constants'
import { ServerBenchmarkStore } from '../stores'
const StyledTextBtn = styled.a`
  display: block;
`
const StyledResult = styled.div``
const StyledAff = styled.a`
  word-break: normal;
`
const Result = ({
  cpu,
  read,
  write,
  date,
}: {
  cpu: number
  read: number
  write: number
  date?: string
}) => {
  const total = cpu + read + write
  const cpuString = cpu.toLocaleString()
  const readString = read.toLocaleString()
  const writeString = write.toLocaleString()
  const totalString = total.toLocaleString()
  const totalText = template(
    '{{cpu}} (CPU) + {{read}} (Read) + {{write}} (Write) = {{total}}',
    {
      cpu: cpuString,
      read: readString,
      write: writeString,
      total: totalString,
    }
  )
  return (
    <StyledResult>
      <CardRuby
        ruby={cpuString}
        rt='CPU'
        onClick={() => copyToClipboard(`CPU: ${cpuString}`)}
      />
      {' + '}
      <CardRuby
        ruby={readString}
        rt={gettext('Read')}
        onClick={() => copyToClipboard(`Read: ${readString}`)}
      />
      {' + '}
      <CardRuby
        ruby={writeString}
        rt={gettext('Write')}
        onClick={() => copyToClipboard(`Write: ${writeString}`)}
      />
      {' = '}
      <CardRuby
        isResult
        ruby={totalString}
        rt={date || ''}
        onClick={() => copyToClipboard(totalText)}
      />
    </StyledResult>
  )
}
const Items: FC = observer(() => {
  const { servers } = ServerBenchmarkStore
  if (!servers) {
    return (
      <CardError>{gettext('Can not fetch marks data from GitHub.')}</CardError>
    )
  }
  const items = servers.map((item) => {
    item.total = item.detail
      ? Object.values(item.detail).reduce((a, b) => a + b, 0)
      : 0
    return item
  })
  items.sort((a, b) => Number(b.total) - Number(a.total))
  const results = items.map(
    ({ name, url, date, proberUrl, binUrl, detail }) => {
      if (!detail) {
        return null
      }
      const { cpu = 0, read = 0, write = 0 } = detail
      const proberLink = proberUrl ? (
        <a
          href={proberUrl}
          target='_blank'
          title={gettext('Visit prober page')}
          rel='noreferrer'
        >
          {' 🔗 '}
        </a>
      ) : (
        ''
      )
      const binLink = binUrl ? (
        <a
          href={binUrl}
          target='_blank'
          title={gettext('Download speed test')}
          rel='noreferrer'
        >
          {' ⬇️ '}
        </a>
      ) : (
        ''
      )
      const title = (
        <StyledAff
          href={url}
          target='_blank'
          title={gettext('Visit the official website')}
        >
          {name}
        </StyledAff>
      )
      return (
        <CardGrid
          key={name}
          name={title}
          tablet={[1, 2]}
          desktopMd={[1, 3]}
          desktopLg={[1, 4]}
        >
          <Result cpu={cpu} read={read} write={write} date={date} />
          {proberLink}
          {binLink}
        </CardGrid>
      )
    }
  )
  return <>{results}</>
})
const TestResults: FC = observer(() => {
  const { marks } = ServerBenchmarkStore
  if (!marks) {
    return null
  }
  return <Result {...marks} />
})
const TestBtn: FC<{ onClick: (e: MouseEvent<HTMLAnchorElement>) => void }> =
  observer(({ onClick }) => {
    const { linkText } = ServerBenchmarkStore
    return (
      <CardGrid
        name={gettext('My server')}
        tablet={[1, 2]}
        desktopMd={[1, 3]}
        desktopLg={[1, 4]}
      >
        <StyledTextBtn onClick={onClick}>{linkText}</StyledTextBtn>
        <TestResults />
      </CardGrid>
    )
  })
export const ServerBenchmark: FC = observer(() => {
  const onClick = useCallback(
    async (e: MouseEvent<HTMLAnchorElement>): Promise<void> => {
      e.preventDefault()
      const { isLoading, setIsLoading, setMarks, setLinkText } =
        ServerBenchmarkStore
      if (isLoading) {
        return
      }
      setLinkText(gettext('⏳ Testing, please wait...'))
      setIsLoading(true)
      const { data = {}, status } = await serverFetch('benchmark')
      const { marks, seconds } = data
      if (status === OK) {
        if (marks) {
          setMarks(marks)
          setLinkText(gettext('👆 Click to test'))
        } else {
          setLinkText(gettext('Network error, please try again later.'))
        }
      } else if (status === TOO_MANY_REQUESTS) {
        setLinkText(
          template(gettext('⏳ Please wait {{seconds}}s'), {
            seconds,
          })
        )
      } else {
        setLinkText(gettext('Network error, please try again later.'))
      }
      setIsLoading(false)
    },
    []
  )
  return (
    <>
      <CardDes>
        {gettext(
          '⚔️ Different versions cannot be compared, and different time servers have different loads, just for reference.'
        )}
      </CardDes>
      <Row>
        {ServerBenchmarkConstants.conf?.disabledMyServerBenchmark || (
          <TestBtn onClick={onClick} />
        )}
        <Items />
      </Row>
    </>
  )
})
