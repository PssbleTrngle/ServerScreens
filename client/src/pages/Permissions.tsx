import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoadingList, useSubmit } from '../api/Hooks';
import { IServerPermissions, IPermissions } from '../api/Models';
import classes from 'classnames'
import API from '../api/Api';

const ServerPermissions = () => {
	const { id } = useParams();
	return useLoadingList<IServerPermissions>(`permissions/server/${id}`, perms =>
		<div className='permissions'>
			{perms.map(p => <Permissions key={p.id} {...p} />)}
		</div>
	)
}

const Permissions = ({ name, specific, base, id: roleId }: IServerPermissions) => {
	const { id } = useParams()

	const [permissions, setPermissions] = useState<{ [key: string]: boolean | undefined }>(specific as any)
	useEffect(() => {
		setPermissions(specific as any)
	}, [specific]);

	const set = (key: string, value: boolean | undefined) => {
		setPermissions(p => {
			const perms = { ...p, [key]: value }
			API.put(`permissions/server/${id}/${roleId}`, perms)
				.catch(e => console.error(e))
			return perms
		})
	}

	return <table>
		<thead>
			<tr>
				<th colSpan={4}>{name}</th>
			</tr>
		</thead>
		<tbody>
			{Object.keys(base).map((k) =>
				<tr key={k}>
					<td>{k}</td>
					{[false, true, undefined].map(v =>
						<td key={`${v}`}>
							<button
								onClick={() => set(k, v)}
								className={classes({ selected: permissions[k] == v })}>
								{typeof v === 'boolean' ? v.toString() : `inherit (${(base as any)[k]})`}
							</button>
						</td>
					)}
				</tr>
			)}
		</tbody>
	</table>
}

export default ServerPermissions;