import { observer } from 'mobx-react-lite'
import { FC } from 'react'
import styled from 'styled-components'
import { CardGrid } from '../../Card/components/card-grid'
import { GUTTER } from '../../Config'
import { gettext } from '../../Language'
import { device } from '../../Style/components/devices'
import { template } from '../../Utils/components/template'
import { ServerStatusStore } from '../stores'
interface StyledSysLoadGroupProps {
  isCenter: boolean
}
export const StyledSysLoadGroup = styled.div<StyledSysLoadGroupProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  @media ${device('tablet')} {
    justify-content: ${({ isCenter }) => (isCenter ? 'center' : 'flex-start')};
  }
`
export const StyledSysLoadGroupItem = styled.span`
  background: ${({ theme }) => theme['sysLoad.bg']};
  color: ${({ theme }) => theme['sysLoad.fg']};
  padding: calc(${GUTTER} / 10) calc(${GUTTER} / 1.5);
  border-radius: 10rem;
  font-family: 'Arial Black', sans-serif;
  font-weight: 700;
  @media ${device('tablet')} {
    padding: calc(${GUTTER} / 10) ${GUTTER};
  }
  & + & {
    margin-left: 0.5rem;
  }
`
interface SysLoadGroupProps {
  sysLoad: number[]
  isCenter: boolean
}
export const SysLoadGroup: FC<SysLoadGroupProps> = ({ sysLoad, isCenter }) => {
  const minutes = [1, 5, 15]
  const loadHuman = sysLoad.map((load, i) => ({
    id: `${minutes[i]}minAvg`,
    load,
    text: template(gettext('{{minute}} minute average'), {
      minute: minutes[i],
    }),
  }))
  return (
    <StyledSysLoadGroup isCenter={isCenter}>
      {loadHuman.map(({ id, load, text }) => (
        <StyledSysLoadGroupItem key={id} title={text}>
          {load.toFixed(2)}
        </StyledSysLoadGroupItem>
      ))}
    </StyledSysLoadGroup>
  )
}
interface SystemLoadProps {
  isCenter?: boolean
}
export const SystemLoad: FC<SystemLoadProps> = observer(
  ({ isCenter = false }) => (
    <CardGrid name={gettext('System load')} tablet={[1, 1]}>
      <SysLoadGroup isCenter={isCenter} sysLoad={ServerStatusStore.sysLoad} />
    </CardGrid>
  )
)
